# Fix readFileSync paths - they still point to root
$scriptDir = "E:\lifegame\scripts"
$files = Get-ChildItem $scriptDir -Filter "*.js"

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix readFileSync - they're trying to load from current dir but should use ../data/
    $content = $content -replace "readFileSync\('\.\/birth_cards_json", "readFileSync('../data/birth_cards_json"
    $content = $content -replace 'readFileSync\("\.\/birth_cards_json', 'readFileSync("../data/birth_cards_json'
    
    $content = $content -replace "readFileSync\('\.\/family_cards_json", "readFileSync('../data/family_cards_json"
    $content = $content -replace 'readFileSync\("\.\/family_cards_json', 'readFileSync("../data/family_cards_json'
    
    $content = $content -replace "readFileSync\('\.\/death_cards_json", "readFileSync('../data/death_cards_json"
    $content = $content -replace 'readFileSync\("\.\/death_cards_json', 'readFileSync("../data/death_cards_json'
    
    $content = $content -replace "readFileSync\('\.\/event_cards_", "readFileSync('../data/event_cards_"
    $content = $content -replace 'readFileSync\("\.\/event_cards_', 'readFileSync("../data/event_cards_'
    
    $content = $content -replace "readFileSync\('\.\/retirement_calibration", "readFileSync('../data/retirement_calibration"
    $content = $content -replace 'readFileSync\("\.\/retirement_calibration', 'readFileSync("../data/retirement_calibration'
    
    # Only write if changed
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host ("Fixed: " + $file.Name)
    }
}

Write-Host ("Total: " + $fixedCount + " files")
