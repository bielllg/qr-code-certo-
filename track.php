<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$db_file = 'data.json';

// Cria o arquivo de dados caso não exista
if (!file_exists($db_file)) {
    $initial = [
        "totalViews" => 0,
        "uniqueVisitors" => [],
        "clicks" => 0,
        "dailyViews" => [],
        "activities" => []
    ];
    file_put_contents($db_file, json_encode($initial));
}

$db = json_decode(file_get_contents($db_file), true);
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(["error" => "No data"]);
    exit;
}

$type = $data['type'] ?? '';
$visitorId = $data['visitorId'] ?? '';
$city = $data['city'] ?? '';

// Configura o fuso horário para o Brasil
date_default_timezone_set('America/Sao_Paulo');
$today = date("Y-m-d");
$now = date("H:i");

if ($type === 'view') {
    $db['totalViews']++;

    if (!isset($db['dailyViews'][$today])) {
        $db['dailyViews'][$today] = 0;
    }
    $db['dailyViews'][$today]++;

    // Visitante único
    if ($visitorId && !in_array($visitorId, $db['uniqueVisitors'])) {
        $db['uniqueVisitors'][] = $visitorId;
        array_unshift($db['activities'], [
            "icon" => "user-plus",
            "color" => "green",
            "text" => "Novo visitante único acessou a página.",
            "time" => "Hoje, $now"
        ]);
    }

    array_unshift($db['activities'], [
        "icon" => "eye",
        "color" => "blue",
        "text" => "Visualização da página" . ($city ? " de $city" : "") . ".",
        "time" => "Hoje, $now"
    ]);

} else if ($type === 'click') {
    $db['clicks']++;
    array_unshift($db['activities'], [
        "icon" => "cursor-click",
        "color" => "yellow",
        "text" => "Clique no botão 'Começar Agora'" . ($city ? " de $city" : "") . ".",
        "time" => "Hoje, $now"
    ]);
}

// Mantém apenas as últimas 50 atividades para não pesar
if (count($db['activities']) > 50) {
    $db['activities'] = array_slice($db['activities'], 0, 50);
}

file_put_contents($db_file, json_encode($db, JSON_PRETTY_PRINT));
echo json_encode(["ok" => true]);
?>
