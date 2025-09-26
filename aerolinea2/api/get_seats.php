<?php
require __DIR__ . '/db.php';
$pdo = get_pdo(); clear_expired_holds($pdo);
$code = $_GET['code'] ?? '';
$fid = $pdo->prepare("SELECT id FROM flights WHERE flight_number=?");
$fid->execute([$code]); $flight_id = $fid->fetchColumn();
if(!$flight_id) json_response(['ok'=>false,'error'=>'Vuelo no encontrado'],404);
$s = $pdo->prepare("SELECT id, seat_code, class, status, hold_expires_at FROM seats WHERE flight_id=? ORDER BY class DESC, seat_code");
$s->execute([$flight_id]);
json_response(['ok'=>true,'seats'=>$s->fetchAll(),'server_time'=>gmdate('Y-m-d H:i:s')]);
