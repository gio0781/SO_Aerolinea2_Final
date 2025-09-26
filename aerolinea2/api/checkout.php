<?php
require __DIR__ . '/db.php';
require __DIR__ . '/session.php';

$pdo = get_pdo();
clear_expired_holds($pdo);

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) { json_response(['ok'=>false,'error'=>'JSON inválido'],400); }

$code = isset($in['flight_code']) ? $in['flight_code'] : null;
$seat_codes = isset($in['seat_codes']) && is_array($in['seat_codes']) ? $in['seat_codes'] : array();
$token = isset($in['token']) ? $in['token'] : null;
$method = isset($in['payment_method']) ? $in['payment_method'] : null;
$categories = isset($in['categories']) && is_array($in['categories']) ? $in['categories'] : array();
$extras = isset($in['extras']) && is_array($in['extras']) ? $in['extras'] : array('bag25'=>0,'bagExtra'=>0);

if (!$code || !$token || !$method || count($seat_codes)===0) {
  json_response(['ok'=>false,'error'=>'Datos incompletos'],400);
}

$fs = $pdo->prepare("SELECT * FROM flights WHERE flight_number=?");
$fs->execute(array($code));
$f = $fs->fetch();
if (!$f) { json_response(['ok'=>false,'error'=>'Vuelo no encontrado'],404); }

$PRICES = array('adulto'=>65950,'nino'=>60500,'tercera'=>50000,'primera'=>120000);
$EXTRAS = array('bag25'=>800,'bagExtra'=>1200);

$pdo->beginTransaction();
try {
  // Lock seats
  $placeholders = implode(',', array_fill(0, count($seat_codes), '?'));
  $params = array_merge(array($f['id']), $seat_codes);
  $stmt = $pdo->prepare("SELECT * FROM seats WHERE flight_id=? AND seat_code IN ($placeholders) FOR UPDATE");
  $stmt->execute($params);
  $seats = $stmt->fetchAll();

  if (count($seats) != count($seat_codes)) {
    $pdo->rollBack();
    json_response(['ok'=>false,'error'=>'Asientos inválidos'],400);
  }

  $now = gmdate('Y-m-d H:i:s');
  foreach ($seats as $s) {
    if ($s['status']==='purchased') {
      $pdo->rollBack(); json_response(['ok'=>false,'error'=>'Un asiento ya fue comprado'],409);
    }
    if ($s['status']!=='hold' || $s['hold_token']!==$token || $s['hold_expires_at']<$now) {
      $pdo->rollBack(); json_response(['ok'=>false,'error'=>'Asientos no reservados correctamente'],409);
    }
  }

  // Totals
  $total = 0;
  foreach ($seats as $s) {
    $codeSeat = $s['seat_code'];
    $cat = isset($categories[$codeSeat]) ? $categories[$codeSeat] : 'adulto';
    if ($s['class']==='first') $total += $PRICES['primera'];
    else {
      if (!isset($PRICES[$cat])) $cat = 'adulto';
      $total += $PRICES[$cat];
    }
  }

  // Extras
  $extras_total = 0;
  foreach ($extras as $exCode=>$qty) {
    $q = intval($qty);
    if ($q>0 && isset($EXTRAS[$exCode])) $extras_total += $q * $EXTRAS[$exCode];
  }

  $user_id = isset($_SESSION['user']['id']) ? intval($_SESSION['user']['id']) : null;

  // Reservation code (always generated)
  $reservation_code = 'RSV-' . strtoupper(substr(md5(uniqid($token, true)),0,8));

  // Check if purchases has reservation_code column (so we can work with older DBs too)
  $has_res_col = false;
  try{
    $chk = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='purchases' AND COLUMN_NAME='reservation_code'");
    $chk->execute();
    $has_res_col = intval($chk->fetchColumn()) > 0;
  }catch(Exception $e){ $has_res_col=false; }

  if ($has_res_col) {
    $ins = $pdo->prepare("INSERT INTO purchases (flight_id,user_id,token,payment_method,total_amount,extras_amount,reservation_code,created_at_utc) VALUES (?,?,?,?,?,?,?,UTC_TIMESTAMP())");
    $ins->execute(array($f['id'],$user_id,$token,$method,$total,$extras_total,$reservation_code));
  } else {
    $ins = $pdo->prepare("INSERT INTO purchases (flight_id,user_id,token,payment_method,total_amount,extras_amount,created_at_utc) VALUES (?,?,?,?,?,?,UTC_TIMESTAMP())");
    $ins->execute(array($f['id'],$user_id,$token,$method,$total,$extras_total));
  }
  $pid = $pdo->lastInsertId();

  // Save items
  $u = $pdo->prepare("UPDATE seats SET status='purchased' WHERE id=?");
  $i = $pdo->prepare("INSERT INTO purchase_items (purchase_id, seat_code, category, price) VALUES (?,?,?,?)");
  foreach ($seats as $s) {
    $codeSeat = $s['seat_code'];
    $cat = isset($categories[$codeSeat]) ? $categories[$codeSeat] : 'adulto';
    $price = ($s['class']==='first') ? $PRICES['primera'] : (isset($PRICES[$cat])?$PRICES[$cat]:$PRICES['adulto']);
    $u->execute(array($s['id']));
    $i->execute(array($pid,$codeSeat,$cat,$price));
  }

  // Save extras breakdown
  if ($extras_total>0) {
    $insE = $pdo->prepare("INSERT INTO purchase_extras (purchase_id, code, label, qty, unit_price, subtotal) VALUES (?,?,?,?,?,?)");
    foreach ($extras as $exCode=>$qty) {
      $q = intval($qty);
      if ($q>0 && isset($EXTRAS[$exCode])) {
        $label = ($exCode==='bag25') ? 'Equipaje documentado 25kg' : 'Maleta adicional';
        $insE->execute(array($pid,$exCode,$label,$q,$EXTRAS[$exCode],$q*$EXTRAS[$exCode]));
      }
    }
  }

  $pdo->commit();
  json_response(array('ok'=>true,'receipt'=>array(
    'flight_number'=>$f['flight_number'],
    'origin'=>$f['origin'],
    'destination'=>$f['destination'],
    'date'=>$f['date'],
    'time'=>$f['time'],
    'terminal'=>$f['terminal'],
    'gate'=>$f['gate'],
    'num_seats'=>count($seats),
    'seat_codes'=>$seat_codes,
    'payment_method'=>$method,
    'reservation_code'=>$reservation_code,
    'extras_total'=>$extras_total,
    'total'=>$total + $extras_total
  )));
} catch (Exception $e) {
  $pdo->rollBack();
  json_response(array('ok'=>false,'error'=>'Error al confirmar compra'),500);
}
