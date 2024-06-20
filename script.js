document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("nav a");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const backToTopButton = document.getElementById("back-to-top");
    const scrollIndicator = document.createElement("div");
    scrollIndicator.id = "scroll-indicator";
    document.body.appendChild(scrollIndicator);

    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            const targetSectionId = this.getAttribute("href").substring(1);
            const targetSection = document.getElementById(targetSectionId);

            const sections = document.querySelectorAll(".content-section");
            sections.forEach(section => {
                section.classList.remove("active");
            });

            targetSection.classList.add("active");

            // Smooth scroll to the section
            window.scrollTo({
                top: targetSection.offsetTop - document.querySelector("header").offsetHeight,
                behavior: "smooth"
            });
        });
    });

    darkModeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");
    });

    // Back to Top button functionality
    window.addEventListener("scroll", function () {
        if (window.scrollY > 300) {
            backToTopButton.style.display = "block";
        } else {
            backToTopButton.style.display = "none";
        }

        // Update scroll indicator width
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;
        scrollIndicator.style.width = scrollPercent + "%";
    });

    backToTopButton.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // Load and display blog posts
    fetch('blog.json')
        .then(response => response.json())
        .then(data => {
            const blogContainer = document.getElementById('blog-container');
            data.forEach(blogPost => {
                const blogDiv = document.createElement('div');
                blogDiv.classList.add('blog-item');

                const blogTitle = document.createElement('h3');
                blogTitle.textContent = blogPost.title;

                const blogDate = document.createElement('p');
                blogDate.textContent = blogPost.date;

                const blogContent = document.createElement('p');
                blogContent.textContent = blogPost.content;

                blogDiv.appendChild(blogTitle);
                blogDiv.appendChild(blogDate);
                blogDiv.appendChild(blogContent);

                blogContainer.appendChild(blogDiv);
            });
        })
        .catch(error => console.error('Error loading blog:', error));

    // Load and display news items
    fetch('news.json')
        .then(response => response.json())
        .then(data => {
            const newsContainer = document.getElementById('news-container');
            data.forEach(newsItem => {
                const newsDiv = document.createElement('div');
                newsDiv.classList.add('news-item');

                const newsTitle = document.createElement('h3');
                newsTitle.textContent = newsItem.title;

                const newsDescription = document.createElement('p');
                newsDescription.textContent = newsItem.description;

                newsDiv.appendChild(newsTitle);
                newsDiv.appendChild(newsDescription);

                newsContainer.appendChild(newsDiv);
            });
        })
        .catch(error => console.error('Error loading news:', error));
});
