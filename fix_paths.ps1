# Fix all broken require paths in scripts
$scriptDir = "E:\lifegame\scripts"
$files = Get-ChildItem $scriptDir -Filter "*.js"

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix engine requires
    $content = $content -replace "require\('\.\/game_engine_v2_homeostatic\.js", "require('../game_engine_v2_homeostatic.js"
    $content = $content -replace 'require\("\.\/game_engine_v2_homeostatic\.js', 'require("../game_engine_v2_homeostatic.js'
    
    $content = $content -replace "require\('\.\/game_engine_integrated\.js", "require('../game_engine_integrated.js"
    $content = $content -replace 'require\("\.\/game_engine_integrated\.js', 'require("../game_engine_integrated.js'
    
    # Fix JSON requires
    $content = $content -replace "require\('\.\/birth_cards_json\.json", "require('../data/birth_cards_json.json"
    $content = $content -replace 'require\("\.\/birth_cards_json\.json', 'require("../data/birth_cards_json.json'
    
    $content = $content -replace "require\('\.\/family_cards_json\.json", "require('../data/family_cards_json.json"
    $content = $content -replace 'require\("\.\/family_cards_json\.json', 'require("../data/family_cards_json.json'
    
    $content = $content -replace "require\('\.\/death_cards_json\.json", "require('../data/death_cards_json.json"
    $content = $content -replace 'require\("\.\/death_cards_json\.json', 'require("../data/death_cards_json.json'
    
    $content = $content -replace "require\('\.\/event_cards_", "require('../data/event_cards_"
    $content = $content -replace 'require\("\.\/event_cards_', 'require("../data/event_cards_'
    
    # Only write if changed
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host ("Fixed: " + $file.Name)
    }
}

Write-Host ("Total: " + $fixedCount + " files")
