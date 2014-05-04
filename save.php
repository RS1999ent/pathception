<?php

//turn off error reporting for clients that report output
error_reporting(0);

header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

$savefile = __DIR__ . "/save.txt";

if (isset($_GET["load"])) {
	$saveloc = $savefile;
	if (isset($_GET["path"])) {
		//e.g. http://localhost/probdiag/trunk/save.php?load=true&path=realuser/students/2626.txt
		$saveloc = __DIR__ . "/doc/study/saves/" . $_GET["path"];
	}
	$lines = file($saveloc);
	$retstr = "[\n";
	foreach ($lines as $ldx => $line) {
		$retstr = $retstr . $line;
		if ($ldx != count($lines) - 1) {
			$retstr = $retstr . ",";
		}
	}
	$retstr = $retstr . "]";
	echo $retstr;
	exit(0);
}

$saveline = json_encode($_GET) . "\n";
$success = file_put_contents($savefile, $saveline, FILE_APPEND);

echo json_encode(array("status" => ($success ? "success" : "failure")));

?>