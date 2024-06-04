// Constants for canvas and context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Variables for drawing state
let currentTool = 'brush';
let currentColor = '#000000';
let isDrawing = false;
let isSelecting = false;
let startX, startY, endX, endY;
let savedImageData;
let selectedArea = null;
let undoStack = [];
let redoStack = [];
let zoomLevel = 1;
let isPanning = false;
let isLassoSelecting = false;
let lassoPoints = [];
let showGrid = false;
let gridSize = 20; // Adjust as needed
let gridColor = '#CCCCCC'; // Adjust as needed
let brushSize = 10;
let brushSharpness = 1;

// Tool buttons event listener
document.getElementById('tools').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        currentTool = event.target.id;
        showFeedback(`Selected tool: ${currentTool}`);
    }
});

// Color picker event listener
document.getElementById('color-picker').addEventListener('input', (event) => {
    currentColor = event.target.value;
    updateHSVFromColor(currentColor);
});

// HSV sliders event listeners
document.getElementById('hue').addEventListener('input', updateColorFromHSV);
document.getElementById('saturation').addEventListener('input', updateColorFromHSV);
document.getElementById('value').addEventListener('input', updateColorFromHSV);

// Predefined palettes event listener
document.getElementById('predefined-palettes').addEventListener('click', (event) => {
    if (event.target.classList.contains('palette-color')) {
        currentColor = rgbToHex(event.target.style.backgroundColor);
        document.getElementById('color-picker').value = currentColor;
        updateHSVFromColor(currentColor);
        showFeedback(`Selected color: ${currentColor}`);
    }
});

// Drawing logic
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseout', handleMouseOut);
canvas.addEventListener('click', handleClick);

function handleMouseDown(event) {
    startX = event.offsetX;
    startY = event.offsetY;
    isDrawing = true;
    saveState();
    if (currentTool === 'brush' || currentTool === 'spray') {
        draw(event);
    } else if (currentTool === 'select') {
        if (event.shiftKey) {
            startLassoSelection(event);
        } else {
            startMarqueeSelection(event);
        }
    } else if (currentTool === 'fill') {
        // Call the fill function when the user clicks with the fill tool selected
        handleFill(event); // Pass the event object
    }
}


function handleMouseMove(event) {
    if (isDrawing && (currentTool === 'brush' || currentTool === 'spray')) {
        draw(event);
    } else if (isDrawing && currentTool === 'select') {
        if (isLassoSelecting) {
            updateLassoSelection(event);
        } else if (isSelecting) {
            updateMarqueeSelection(event);
        }
    }
}

function handleMouseUp(event) {
    isDrawing = false;
    if (currentTool === 'line') {
        draw(event);
    } else if (currentTool === 'select') {
        if (isLassoSelecting) {
            endLassoSelection(event);
        } else if (isSelecting) {
            endMarqueeSelection(event);
        } else {
            finalizeSelection(event);
        }
    }
}

// Function to handle mouseout event
function handleMouseOut(event) {
    switch (currentTool) {
        case 'brush':
        case 'spray':
        case 'line':
            isDrawing = false;
            break;
        // Add cases for other tools as needed
        default:
            break;
    }
}

// Function to handle click event
function handleClick(event) {
    switch (currentTool) {
        case 'brush':
        case 'spray':
        case 'line':
            // No action needed on click for these tools
            break;
        case 'select':
            if (!isSelecting && !isLassoSelecting) {
                startMarqueeSelection(event);
            }
            break;
        default:
            break;
    }
}

// Function to draw
function draw(event) {
    switch (currentTool) {
        case 'brush':
        case 'spray':
            if (isDrawing) {
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(event.offsetX, event.offsetY);
                ctx.stroke();
                startX = event.offsetX;
                startY = event.offsetY;
            }
            break;
        case 'line':
            if (isDrawing) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Redraw the original image
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(event.offsetX, event.offsetY);
                ctx.stroke();
            }
            break;
        case 'select':
            // No action needed for drawing with the select tool
            break;
        // Add cases for other tools as needed
        default:
            break;
    }
}


// Function to handle fill tool
function handleFill(event) {
    const clickedPixel = getPixelColor(event.offsetX, event.offsetY);
    const targetColor = clickedPixel;

    // Get the coordinates of the clicked pixel
    const startX = event.offsetX;
    const startY = event.offsetY;

    // Queue for flood fill algorithm
    let queue = [{ x: startX, y: startY }];

    while (queue.length) {
        const { x, y } = queue.pop();

        // If the pixel at (x, y) is not the same color as the clicked pixel, skip
        if (!isSameColor(getPixelColor(x, y), targetColor)) {
            continue;
        }

        // Set the color of the pixel at (x, y) to the current color
        setPixelColor(x, y, currentColor);

        // Add adjacent pixels to the queue
        if (x > 0) queue.push({ x: x - 1, y: y });
        if (x < canvas.width - 1) queue.push({ x: x + 1, y: y });
        if (y > 0) queue.push({ x: x, y: y - 1 });
        if (y < canvas.height - 1) queue.push({ x: x, y: y + 1 });
    }
}

// Function to get pixel color at coordinates (x, y)
function getPixelColor(x, y) {
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    return rgbToHex(data[0], data[1], data[2]); // Assuming rgbToHex is implemented
}

// Function to set pixel color at coordinates (x, y)
function setPixelColor(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// Function to check if two colors are the same
function isSameColor(color1, color2) {
    return color1 === color2;
}



// Function to update HSV from color
function updateHSVFromColor(color) {
    // Convert hex color to RGB
    const rgb = hexToRgb(color);
    // Convert RGB to HSV
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    // Update HSV sliders
    document.getElementById('hue').value = hsv.h;
    document.getElementById('saturation').value = hsv.s;
    document.getElementById('value').value = hsv.v;
}

// Function to update color from HSV
function updateColorFromHSV() {
    // Get HSV values
    const hue = parseInt(document.getElementById('hue').value);
    const saturation = parseInt(document.getElementById('saturation').value);
    const value = parseInt(document.getElementById('value').value);
    // Convert HSV to RGB
    const rgb = hsvToRgb(hue, saturation, value);
    // Convert RGB to hex
    const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    // Update current color
    currentColor = hexColor;
    // Update color picker value
    document.getElementById('color-picker').value = currentColor;
}

// Function to convert RGB to Hex
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Function to finalize selection
function finalizeSelection(event) {
    // Implement logic to finalize selection based on the current tool
    if (currentTool === 'select') {
        // Draw the selected area
        ctx.strokeStyle = '#FF0000';
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        // Update selected area coordinates
        selectedArea = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY
        };
    }
}

// Function to handle panning
function handlePan(event) {
    if (isPanning) {
        // Implement logic to handle panning of the canvas
        // For example:
        canvas.style.cursor = 'move';
        canvas.style.cursor = '-webkit-grabbing';
        // Update canvas position based on mouse movement
        // You may need to store previous mouse position and calculate delta
        // Then update the canvas position accordingly
    }
}

// Function to handle zoom
function handleZoom(event) {
    // Implement logic to handle zooming of the canvas
    // For example:
    const delta = event.deltaY;
    const zoomSpeed = 0.1; // Adjust zoom speed as needed
    if (delta > 0) {
        zoomLevel -= zoomSpeed;
    } else {
        zoomLevel += zoomSpeed;
    }
    // Apply zoom transformation to the canvas
    canvas.style.transform = `scale(${zoomLevel})`;
}

// Function to handle keydown events
function handleKeyDown(event) {
    switch (currentTool) {
        case 'select':
            if (event.key === 'Shift') {
                // Start lasso selection
                startLassoSelection(event);
            }
            break;
        // Add cases for other tools as needed
        default:
            break;
    }
}

// Function to handle keyup events
function handleKeyUp(event) {
    switch (currentTool) {
        case 'select':
            if (event.key === 'Shift') {
                // End lasso selection
                endLassoSelection(event);
            }
            break;
        // Add cases for other tools as needed
        default:
            break;
    }
}



// Function to start lasso selection
function startLassoSelection(event) {
    isLassoSelecting = true;
    lassoPoints = [{ x: event.offsetX, y: event.offsetY }];
}

// Function to update lasso selection
function updateLassoSelection(event) {
    if (isLassoSelecting) {
        lassoPoints.push({ x: event.offsetX, y: event.offsetY });
        drawLassoSelection();
    }
}

// Function to end lasso selection
function endLassoSelection(event) {
    if (isLassoSelecting) {
        isLassoSelecting = false;
        // Add logic here to handle the lasso selection
    }
}

// Function to start marquee selection
function startMarqueeSelection(event) {
    isSelecting = true;
    startX = event.offsetX;
    startY = event.offsetY;
}

// Function to update marquee selection
function updateMarqueeSelection(event) {
    if (isSelecting) {
        endX = event.offsetX;
        endY = event.offsetY;
        drawMarqueeSelection();
    }
}

// Function to end marquee selection
function endMarqueeSelection(event) {
    if (isSelecting) {
        isSelecting = false;
        endX = event.offsetX;
        endY = event.offsetY;
        // Add logic here to handle the selected area
    }
}

// Function to draw lasso selection
function drawLassoSelection() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the original image
    // Draw the lasso selection shape
    ctx.strokeStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
    }
    ctx.stroke();
}

// Function to draw marquee selection
function drawMarqueeSelection() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the original image
    // Draw the marquee selection box
    ctx.strokeStyle = '#FF0000';
    ctx.strokeRect(startX, startY, endX - startX, endY - startY);
}

// Function to move selection
function moveSelection(dx, dy) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the original image
    // Draw the marquee selection box at the new position
    ctx.strokeStyle = '#FF0000';
    ctx.strokeRect(startX + dx, startY + dy, endX - startX, endY - startY);
    // Draw the selected area at the new position
    // Implement the logic to redraw the selected area according to your application's requirements
}

// Function to rotate the marquee-selected area
function rotateSelection(angle) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the original image
    // Calculate the center of the selected area
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    // Translate the canvas to the center of the selected area
    ctx.translate(centerX, centerY);
    // Rotate the canvas by the specified angle
    ctx.rotate(angle * Math.PI / 180); // Convert degrees to radians
    // Translate the canvas back to its original position
    ctx.translate(-centerX, -centerY);
    // Redraw the marquee selection box and the selected area at the rotated position
}

// Function to scale the marquee-selected area
function scaleSelection(scaleX, scaleY) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the original image
    // Calculate the center of the selected area
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    // Scale the canvas from the center of the selected area
    ctx.translate(centerX, centerY);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-centerX, -centerY);
    // Redraw the marquee selection box and the selected area at the scaled position
}

// Function to skew the marquee-selected area
function skewSelection(angleX, angleY) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the original image
    // Calculate the center of the selected area
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    // Apply the skew transformation
    ctx.transform(1, Math.tan(angleY * Math.PI / 180), Math.tan(angleX * Math.PI / 180), 1, 0, 0);
    // Draw the marquee selection box and the selected area with the skew transformation applied
}

// Undo and Redo functionality
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        ctx.putImageData(undoStack.pop(), 0, 0);
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        ctx.putImageData(redoStack.pop(), 0, 0);
    }
}

// Function to save canvas state
function saveState() {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// Grid toggle
document.getElementById('grid-toggle').addEventListener('change', (event) => {
    showGrid = event.target.checked;
    redrawCanvas();
});

// Function to redraw canvas with grid
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the original image
    if (showGrid) {
        drawGrid();
    }
}

// Function to draw grid
function drawGrid() {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Clear canvas
document.getElementById('clear-canvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Clear undo and redo stacks
    undoStack = [];
    redoStack = [];
});

// Download image
document.getElementById('save-image').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Feedback function
function showFeedback(message) {
    feedback.textContent = message;
}

// Initialize
redrawCanvas();