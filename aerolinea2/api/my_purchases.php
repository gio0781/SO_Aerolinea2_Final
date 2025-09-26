<?php
require __DIR__ . '/db.php';
require __DIR__ . '/session.php';
if (!isset($_SESSION['user'])) json_response(['ok'=>true,'purchases'=>[]]);
$pdo = get_pdo();
$stmt = $pdo->prepare("
  SELECT p.id, p.created_at_utc, p.total_amount, p.extras_amount, p.payment_method, p.reservation_code,
         f.flight_number, f.origin, f.destination, f.date, f.time, f.terminal, f.gate
  FROM purchases p JOIN flights f ON f.id=p.flight_id
  WHERE p.user_id=? ORDER BY p.created_at_utc DESC
");
$stmt->execute([$_SESSION['user']['id']]); $rows=$stmt->fetchAll();
$item = $pdo->prepare("SELECT seat_code, category, price FROM purchase_items WHERE purchase_id=?");
$extra = $pdo->prepare("SELECT code,label,qty,unit_price,subtotal FROM purchase_extras WHERE purchase_id=?");
foreach($rows as &$r){ $item->execute([$r['id']]); $r['items']=$item->fetchAll(); $extra->execute([$r['id']]); $r['extras']=$extra->fetchAll(); }
json_response(['ok'=>true,'purchases'=>$rows]);
