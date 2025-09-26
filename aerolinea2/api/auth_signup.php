<?php
require __DIR__ . '/db.php';
require __DIR__ . '/session.php';
$pdo = get_pdo();
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) json_response(['ok'=>false,'error'=>'JSON inválido'],400);
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$pass = $input['password'] ?? '';
if ($name==='' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass)<8) json_response(['ok'=>false,'error'=>'Datos inválidos'],400);
try{
  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $pdo->prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)")->execute([$name,$email,$hash]);
  $_SESSION['user'] = ['id'=>$pdo->lastInsertId(),'name'=>$name,'email'=>$email];
  json_response(['ok'=>true,'user'=>$_SESSION['user'],'message'=>'Cuenta creada']);
}catch(PDOException $e){
  if(($e->errorInfo[1] ?? null)==1062) json_response(['ok'=>false,'error'=>'El correo ya está registrado'],409);
  json_response(['ok'=>false,'error'=>'Error en el registro'],500);
}
