document.addEventListener("DOMContentLoaded", function() {
    const navLinks = document.querySelectorAll("nav a");

    navLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();

            const targetSectionId = this.getAttribute("data-section");
            const targetSection = document.getElementById(targetSectionId);

            const sections = document.querySelectorAll(".content-section");
            sections.forEach(section => {
                section.classList.remove("active");
            });

            targetSection.classList.add("active");
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
