<?php
require __DIR__ . '/db.php';
$pdo = get_pdo();
$q = trim($_GET['q'] ?? '');
if ($q==='') { $r=$pdo->query("SELECT * FROM flights ORDER BY date,time")->fetchAll(); json_response(['ok'=>true,'flights'=>$r]); }
$qLike = '%'.$q.'%';
$stmt = $pdo->prepare("SELECT * FROM flights WHERE flight_number LIKE ? OR origin LIKE ? OR destination LIKE ? OR terminal LIKE ? OR gate LIKE ? ORDER BY date,time");
$stmt->execute([$qLike,$qLike,$qLike,$qLike,$qLike]);
json_response(['ok'=>true,'flights'=>$stmt->fetchAll()]);
