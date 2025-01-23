<?php
session_start();
require_once('../includes/config.php');
require_once('../includes/auth.php');

// Check if user is logged in
if (!isLoggedIn()) {
    header('Location: login.php');
    exit();
}
?>

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Admin Panel - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <div class="admin-wrapper">
        <nav class="admin-nav">
            <ul>
                <li><a href="menu.php">Gestione Menu</a></li>
                <li><a href="prenotazioni.php">Prenotazioni</a></li>
                <li><a href="gallery.php">Galleria</a></li>
                <li><a href="recensioni.php">Recensioni</a></li>
                <li><a href="settings.php">Impostazioni</a></li>
            </ul>
        </nav>
        <!-- Dashboard content -->
    </div>
</body>
</html> 