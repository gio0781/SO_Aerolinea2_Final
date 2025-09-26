<?php
require __DIR__ . '/db.php';
$pdo = get_pdo();
$in = json_decode(file_get_contents('php://input'), true);
$code = $in['flight_code'] ?? null; $seat = $in['seat_code'] ?? null; $tok = $in['token'] ?? null;
if(!$code||!$seat||!$tok) json_response(['ok'=>false,'error'=>'Datos incompletos'],400);
$fid = $pdo->prepare("SELECT id FROM flights WHERE flight_number=?"); $fid->execute([$code]); $flight_id=$fid->fetchColumn();
if(!$flight_id) json_response(['ok'=>false,'error'=>'Vuelo no encontrado'],404);
$pdo->beginTransaction();
try{
  $stmt = $pdo->prepare("SELECT * FROM seats WHERE flight_id=? AND seat_code=? FOR UPDATE");
  $stmt->execute([$flight_id,$seat]); $s=$stmt->fetch();
  if($s && $s['status']==='hold' && $s['hold_token']===$tok){
    $pdo->prepare("UPDATE seats SET status='free', hold_token=NULL, hold_expires_at=NULL WHERE id=?")->execute([$s['id']]);
  }
  $pdo->commit(); json_response(['ok'=>true]);
}catch(Exception $e){ $pdo->rollBack(); json_response(['ok'=>false,'error'=>'Error al liberar'],500); }
