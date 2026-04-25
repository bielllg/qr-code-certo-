<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$db_file = 'data.json';

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

$action = $_GET['action'] ?? '';

if ($action === 'reset') {
    $initial = [
        "totalViews" => 0,
        "uniqueVisitors" => [],
        "clicks" => 0,
        "dailyViews" => [],
        "activities" => []
    ];
    file_put_contents($db_file, json_encode($initial));
    echo json_encode(["ok" => true, "message" => "Dados resetados!"]);
    exit;
}

$labels = [];
$values = [];
$diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

for ($i = 6; $i >= 0; $i--) {
    $d = strtotime("-$i days");
    $key = date("Y-m-d", $d);
    $labels[] = $diasSemana[date("w", $d)];
    $values[] = $db['dailyViews'][$key] ?? 0;
}

$uniqueCount = count($db['uniqueVisitors']);
$conversionRate = $db['totalViews'] > 0 
    ? number_format(($db['clicks'] / $db['totalViews']) * 100, 1, '.', '')
    : "0.0";

echo json_encode([
    "totalViews" => $db['totalViews'],
    "uniqueVisitors" => $uniqueCount,
    "clicks" => $db['clicks'],
    "conversionRate" => $conversionRate,
    "chart" => [ "labels" => $labels, "values" => $values ],
    "activities" => array_slice($db['activities'], 0, 8)
]);
?>
