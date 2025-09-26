<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
$config = require __DIR__ . '/../config.php';
function get_pdo(){
  global $config;
  $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4";
  $opt = [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false];
  return new PDO($dsn, $config['db_user'], $config['db_pass'], $opt);
}
function json_response($data,$code=200){
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data);
  exit;
}
function clear_expired_holds($pdo){
  $pdo->prepare("UPDATE seats SET status='free', hold_token=NULL, hold_expires_at=NULL WHERE status='hold' AND hold_expires_at < UTC_TIMESTAMP()")->execute();
}
