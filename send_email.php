<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Set your email address
    $to_email = "thomaseflach@gmail.com";
    
    // Get form data
    $name = $_POST['name'];
    $email = $_POST['email'];
    $message = $_POST['message'];
    
    // Email subject
    $subject = "[WEBSITE MESSAGE] New message from $name";
    
    // Email content
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";
    
    // Email headers
    $headers = "From: $name <$email>";
    
    // Send email
    mail($to_email, $subject, $email_content, $headers);
    
    // Redirect back to the contact page
    header("Location: contact.html?status=success");
} else {
    // Redirect back to the contact page if accessed directly
    header("Location: contact.html");
}
?>
