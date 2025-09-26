<?php
require __DIR__ . '/db.php';
require __DIR__ . '/session.php';
$pdo = get_pdo();
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) json_response(['ok'=>false,'error'=>'JSON inválido'],400);
$email = trim($input['email'] ?? ''); $pass = $input['password'] ?? '';
if(!filter_var($email, FILTER_VALIDATE_EMAIL) || $pass==='') json_response(['ok'=>false,'error'=>'Credenciales inválidas'],400);
$stmt = $pdo->prepare("SELECT * FROM users WHERE email=?"); $stmt->execute([$email]); $u=$stmt->fetch();
if(!$u || !password_verify($pass, $u['password_hash'])) json_response(['ok'=>false,'error'=>'Correo o contraseña incorrectos'],401);
$_SESSION['user'] = ['id'=>$u['id'],'name'=>$u['name'],'email'=>$u['email']];
json_response(['ok'=>true,'user'=>$_SESSION['user'],'message'=>'Sesión iniciada']);
