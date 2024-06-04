document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const mainMenu = document.getElementById("mainMenu");
    const leaderboardDiv = document.getElementById("leaderboard");
    const leaderboardList = document.getElementById("leaderboardList");
    const playButton = document.getElementById("playButton");
    const leaderboardButton = document.getElementById("leaderboardButton");
    const backButton = document.getElementById("backButton");
    const quitButton = document.getElementById("quitButton");

    const backgroundMusic = document.getElementById("backgroundMusic");

    const screen_width = canvas.width;
    const screen_height = canvas.height;
    const frog_width = 32;
    const frog_height = 32;
    let frog_x = (screen_width - frog_width) / 2;
    let frog_y = screen_height - frog_height - 10;
    const frog_speed = 5;
    let leafangle = Math.floor(Math.random() * 13) - 6;
    let high_scores = [];
    let isPaused = false;
    let score = 0;
	

    let movingLeft = false;
    let movingRight = false;
    let movingUp = false;
    let movingDown = false;

    const colors = {
        WHITE: "#ffffff",
        GREEN: "#00ff00",
        RED: "#ff0000",
        YELLOW: "#ffff00",
        BROWN: "#8b4513",
        BLUE: "#0000ff",
        GRAY: "#646464",
    };

    class Vehicle {
        constructor(x, y, width, height, speed, color, lightColor) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.speed = speed;
            this.color = color;
            this.lightColor = lightColor;
        }
    
        move() {
            this.x += this.speed;
        }
    
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.speed > 0) {
                ctx.scale(-1, 1); // Mirror the vehicle driving to the right
            }
    
            // Draw the bumpers
            ctx.fillStyle = "#C0C0C0"; // Silver color
            ctx.fillRect(-this.width / 2 - 3, -this.height / 2, 3, this.height); // Front bumper
            ctx.fillRect(this.width / 2, -this.height / 2, 4, this.height); // Rear bumper
    
            // Draw the headlights
            ctx.fillStyle = "#FFFF99"; // Light yellow color
            ctx.beginPath();
            ctx.arc(-this.width / 2 -2, -this.height / 4, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-this.width / 2 -2, this.height / 4, 5, 0, Math.PI * 2);
            ctx.fill();	
	
	
	
	
	
            // Draw the main body of the vehicle
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    
            // Draw the windows/lightColor
            ctx.fillStyle = this.lightColor;
            ctx.fillRect(-this.width / 2 + 20, -this.height / 2 + 5, this.width - 40 + (this.width / 10), this.height - 10);
    

    
            ctx.restore();
        }
    }

    const vehicles_left = [];
    const vehicles_right = [];

    function collision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    function showGameOver() {
        pauseGame();
        const gameOverDiv = document.createElement("div");
        gameOverDiv.id = "gameOverDiv";
        gameOverDiv.style.position = "absolute";
        gameOverDiv.style.top = "50%";
        gameOverDiv.style.left = "50%";
        gameOverDiv.style.transform = "translate(-50%, -50%)";
        gameOverDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        gameOverDiv.style.padding = "20px";
        gameOverDiv.style.borderRadius = "10px";

        const gameOverText = document.createElement("h2");
        gameOverText.textContent = "Game Over";
        gameOverText.style.color = "white";
        gameOverText.style.textAlign = "center";
        gameOverDiv.appendChild(gameOverText);

        const restartButton = createButton("Restart", "green", resetGame);
        const quitButton = createButton("Quit", "red", () => window.location.href = "http://localhost:8000/tomflach.html");


        gameOverDiv.appendChild(restartButton);
        gameOverDiv.appendChild(quitButton);
        document.body.appendChild(gameOverDiv);
    }

    function createButton(text, color, onClick) {
        const button = document.createElement("button");
        button.textContent = text;
        button.style.display = "block";
        button.style.margin = "10px auto";
        button.style.padding = "10px 20px";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.backgroundColor = color;
        button.style.color = "white";
        button.style.cursor = "pointer";
        button.addEventListener("click", function() {
            onClick();
            button.parentElement.remove();
        });
        return button;
    }

    function showScore() {
        ctx.fillStyle = colors.WHITE;
        ctx.font = "24px Arial";
        ctx.fillText("Score: " + score, 10, 30);
    }

    function resetGame() {
        score = 0;
        frog_x = (screen_width - frog_width) / 2;
        frog_y = screen_height - frog_height - 10;
        vehicles_left.length = 0;
        vehicles_right.length = 0;
        const gameOverDiv = document.getElementById("gameOverDiv");
        if (gameOverDiv) gameOverDiv.remove();
        resumeGame();
    }

    function drawRoadAndLilyPads() {
        ctx.fillStyle = colors.BROWN;
        ctx.fillRect(0, screen_height - 98, screen_width, 100);

        ctx.fillStyle = colors.GRAY;
        ctx.fillRect(0, 102, screen_width, 400);

        ctx.fillStyle = colors.BLUE;
        ctx.fillRect(0, 0, screen_width, 100);

        ctx.strokeStyle = colors.YELLOW;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, screen_height / 2);
        ctx.lineTo(screen_width, screen_height / 2);
        ctx.stroke();

        ctx.strokeStyle = colors.WHITE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, screen_height / 2 - 200);
        ctx.lineTo(screen_width, screen_height / 2 - 200);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, screen_height / 2 + 200);
        ctx.lineTo(screen_width, screen_height / 2 + 200);
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
            const x = 50 + i * 200;
            const y = 50;
            const radius = 12;

            ctx.fillStyle = colors.GREEN;
            ctx.beginPath();
            ctx.arc(x + leafangle, y + radius + leafangle, radius, 0, Math.PI * 2);
            ctx.arc(x, y + radius, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function spawnVehicles() {
        const spawn_rate_factor = Math.max(5, 50 - Math.floor(score / 2));
        
        if (Math.floor(Math.random() * spawn_rate_factor) === 0) {
            const vehicle_width = Math.floor(Math.random() * (90 - 70) + 70);
            const vehicle_height = 40;
            const vehicle_speed = Math.random() * 2 + 2 + score / 50;
            const vehicle_color = [
                "#7d3232",
                "#969696",
                "#323232",
                "#4d4dea",
                "#643264",
                "#326464",
                "#196419",
                "#323264"
            ][Math.floor(Math.random() * 8)];
            const lighter_color = `rgb(${Math.min(255, parseInt(vehicle_color.substr(1, 2), 16) * 1.2)}, ${Math.min(255, parseInt(vehicle_color.substr(3, 2), 16) * 1.2)}, ${Math.min(255, parseInt(vehicle_color.substr(5, 2), 16) * 1.2)})`;

            if (Math.random() < 0.5) {
                vehicles_left.push(new Vehicle(screen_width + 40, Math.floor(Math.random() * (280 - 120) + 120), vehicle_width, vehicle_height, -vehicle_speed, vehicle_color, lighter_color));
            } else {
                vehicles_right.push(new Vehicle(-vehicle_width, Math.floor(Math.random() * (450 - 320) + 320), vehicle_width, vehicle_height, vehicle_speed, vehicle_color, lighter_color));
            }
        }

        // Spawn a zooming vehicle occasionally
        if (Math.floor(Math.random() * 100) === 0) {
            const zooming_vehicle_width = Math.floor(Math.random() * (90 - 70) + 70);
            const zooming_vehicle_height = 40;
            const zooming_vehicle_speed = Math.random() * 4 + 7; // Much higher speed
            const zooming_vehicle_color = "#FF4500"; // Distinct color for zooming vehicle
            const zooming_lighter_color = `rgb(${Math.min(255, parseInt(zooming_vehicle_color.substr(1, 2), 16) * 1.2)}, ${Math.min(255, parseInt(zooming_vehicle_color.substr(3, 2), 16) * 1.2)}, ${Math.min(255, parseInt(zooming_vehicle_color.substr(5, 2), 16) * 1.2)})`;

            if (Math.random() < 0.5) {
                vehicles_left.push(new Vehicle(screen_width + 40, Math.floor(Math.random() * (280 - 120) + 120), zooming_vehicle_width, zooming_vehicle_height, -zooming_vehicle_speed, zooming_vehicle_color, zooming_lighter_color));
            } else {
                vehicles_right.push(new Vehicle(-zooming_vehicle_width, Math.floor(Math.random() * (450 - 320) + 320), zooming_vehicle_width, zooming_vehicle_height, zooming_vehicle_speed, zooming_vehicle_color, zooming_lighter_color));
            }
        }
    }

    function updateFrogPosition() {
        if (movingLeft && frog_x > 0) {
            frog_x -= frog_speed;
        }
        if (movingRight && frog_x < screen_width - frog_width) {
            frog_x += frog_speed;
        }
        if (movingUp && frog_y > 0) {
            frog_y -= frog_speed;
        }
        if (movingDown && frog_y < screen_height - frog_height) {
            frog_y += frog_speed;
        }
    }

    function moveAndDrawVehicles() {
        for (let i = 0; i < vehicles_left.length; i++) {
            vehicles_left[i].move();
            vehicles_left[i].draw();
            if (vehicles_left[i].x < -vehicles_left[i].width) {
                vehicles_left.splice(i, 1);
                i--; // Adjust index after removal
            }
        }

        for (let i = 0; i < vehicles_right.length; i++) {
            vehicles_right[i].move();
            vehicles_right[i].draw();
            if (vehicles_right[i].x > screen_width+40) {
                vehicles_right.splice(i, 1);
                i--; // Adjust index after removal
            }
        }
    }

    function handlePlayerInput() {
        document.addEventListener("keydown", function(event) {
            switch(event.key) {
                case "ArrowLeft":
                    movingLeft = true;
                    break;
                case "ArrowRight":
                    movingRight = true;
                    break;
                case "ArrowUp":
                    movingUp = true;
                    break;
                case "ArrowDown":
                    movingDown = true;
                    break;
            }
        });

        document.addEventListener("keyup", function(event) {
            switch(event.key) {
                case "ArrowLeft":
                    movingLeft = false;
                    break;
                case "ArrowRight":
                    movingRight = false;
                    break;
                case "ArrowUp":
                    movingUp = false;
                    break;
                case "ArrowDown":
                    movingDown = false;
                    break;
            }
        });
    }

    function checkCollisions() {
        const frog_rect = {
            x: frog_x,
            y: frog_y,
            width: frog_width,
            height: frog_height
        };

        for (let vehicle of vehicles_left.concat(vehicles_right)) {
            const vehicle_rect = {
                x: vehicle.x - vehicle.width / 2,
                y: vehicle.y - vehicle.height / 2,
                width: vehicle.width,
                height: vehicle.height
            };

            if (collision(frog_rect, vehicle_rect)) {
                if (score > 0) {
                    const qualified_for_leaderboard = score > (high_scores.length > 0 ? high_scores[high_scores.length - 1][0] : 0);
                    if (qualified_for_leaderboard) {
                        const player_name = prompt("You made it to the leaderboard! Enter your name:");
                        if (player_name) {
                            updateHighScores(score, player_name);
                        }
                    }
                }
                showGameOver();
                return true;
            }
        }
        return false;
    }

    function checkWinCondition() {
        if (frog_y <= 100) {
            score++;
            frog_x = (screen_width - frog_width) / 2;
            frog_y = screen_height - frog_height - 10;
            leafangle = Math.floor(Math.random() * 13) - 6;
            return true;
        }
        return false;
    }

    function updateHighScores(score, playerName) {
        high_scores.push([score, playerName]);
        high_scores.sort((a, b) => b[0] - a[0]);
        high_scores = high_scores.slice(0, 10);
        localStorage.setItem("high_scores", JSON.stringify(high_scores));
    }

    function showWinMessage() {
        ctx.fillStyle = colors.WHITE;
        ctx.font = "24px Arial";
        ctx.fillText("Success!", screen_width / 2 - 50, screen_height / 2);
        pauseGame();
        setTimeout(function() {
            resumeGame();
        }, 2000);
    }

    function pauseGame() {
        isPaused = true;
    }

    function resumeGame() {
        isPaused = false;
    }

    function draw() {
        drawRoadAndLilyPads();
        moveAndDrawVehicles();
        ctx.fillStyle = colors.GREEN;
        ctx.fillRect(frog_x, frog_y + frog_height / 4, frog_width, frog_height / 2);
        ctx.beginPath();
        ctx.ellipse(frog_x + frog_width / 2, frog_y + frog_height / 2, frog_width / 2, frog_width / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(frog_x + frog_width / 2, frog_y + (3 * frog_height) / 4, frog_width / 2, frog_height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        showScore();

        if (isPaused) {
            showWinMessage();
        } else {
            if (checkWinCondition()) {
                pauseGame();
                showWinMessage();
            }
        }
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw();
        spawnVehicles();
        if (!isPaused && !checkCollisions() && !checkWinCondition()) {
            handlePlayerInput();
            updateFrogPosition();
        }

        requestAnimationFrame(gameLoop);
    }

    playButton.addEventListener("click", function() {
        mainMenu.style.display = "none";
        canvas.style.display = "block";
        gameLoop();
		backgroundMusic.play();
    });

    leaderboardButton.addEventListener("click", function() {
        mainMenu.style.display = "none";
        leaderboardDiv.style.display = "block";
        updateLeaderboard();
    });

    backButton.addEventListener("click", function() {
        leaderboardDiv.style.display = "none";
        mainMenu.style.display = "block";
    });

    quitButton.addEventListener("click", function() {
        window.location.href = "http://localhost:8000/tomflach.html";
    });

    function updateLeaderboard() {
        leaderboardList.innerHTML = "";
        high_scores = JSON.parse(localStorage.getItem("high_scores")) || [];
        for (let [score, name] of high_scores) {
            const listItem = document.createElement("li");
            listItem.textContent = `${name}: ${score}`;
            leaderboardList.appendChild(listItem);
        }
    }

    high_scores = JSON.parse(localStorage.getItem("high_scores")) || [];
});
