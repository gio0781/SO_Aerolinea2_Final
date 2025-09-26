<?php
require __DIR__ . '/db.php';
$pdo = get_pdo(); clear_expired_holds($pdo);
$in = json_decode(file_get_contents('php://input'), true);
$code = $in['flight_code'] ?? null; $seat = $in['seat_code'] ?? null; $tok = $in['token'] ?? null;
if(!$code||!$seat||!$tok) json_response(['ok'=>false,'error'=>'Datos incompletos'],400);
$fid = $pdo->prepare("SELECT id FROM flights WHERE flight_number=?"); $fid->execute([$code]); $flight_id=$fid->fetchColumn();
if(!$flight_id) json_response(['ok'=>false,'error'=>'Vuelo no encontrado'],404);
$pdo->beginTransaction();
try{
  $stmt = $pdo->prepare("SELECT * FROM seats WHERE flight_id=? AND seat_code=? FOR UPDATE");
  $stmt->execute([$flight_id,$seat]); $s=$stmt->fetch();
  if(!$s) { $pdo->rollBack(); json_response(['ok'=>false,'error'=>'Asiento inexistente'],404); }
  if($s['status']==='purchased'){ $pdo->rollBack(); json_response(['ok'=>false,'error'=>'Asiento ya comprado'],409); }
  if($s['status']==='hold' && $s['hold_expires_at']>gmdate('Y-m-d H:i:s') && $s['hold_token']!==$tok){
    $pdo->rollBack(); json_response(['ok'=>false,'error'=>'Asiento en reserva por otro usuario'],409);
  }
  $cfg = require __DIR__ . '/../config.php';
  $pdo->prepare("UPDATE seats SET status='hold', hold_token=?, hold_expires_at=DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE) WHERE id=?")->execute([$tok,$cfg['reservation_hold_minutes'],$s['id']]);
  $pdo->commit(); json_response(['ok'=>true]);
}catch(Exception $e){ $pdo->rollBack(); json_response(['ok'=>false,'error'=>'Error de concurrencia'],500); }
