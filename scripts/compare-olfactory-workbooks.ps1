$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-EntryText {
  param(
    [Parameter(Mandatory = $true)]$Zip,
    [Parameter(Mandatory = $true)][string]$Name
  )

  $entry = $Zip.GetEntry($Name)
  if (-not $entry) { return $null }

  $reader = [IO.StreamReader]::new($entry.Open())
  $text = $reader.ReadToEnd()
  $reader.Close()
  return $text
}

function Read-PatientRows {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][int]$HeaderRow
  )

  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)

  $shared = @()
  $sharedXmlText = Get-EntryText -Zip $zip -Name 'xl/sharedStrings.xml'
  if ($sharedXmlText) {
    $sharedXml = [xml]$sharedXmlText
    $ns = New-Object System.Xml.XmlNamespaceManager($sharedXml.NameTable)
    $ns.AddNamespace('a', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $shared = @($sharedXml.SelectNodes('//a:sst/a:si', $ns) | ForEach-Object { $_.InnerText })
  }

  $sheetXml = [xml](Get-EntryText -Zip $zip -Name 'xl/worksheets/sheet1.xml')
  $ns = New-Object System.Xml.XmlNamespaceManager($sheetXml.NameTable)
  $ns.AddNamespace('a', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

  $rows = @()
  foreach ($row in $sheetXml.SelectNodes('//a:sheetData/a:row', $ns)) {
    if ([int]$row.r -le $HeaderRow) { continue }

    $cells = @{}
    foreach ($c in $row.SelectNodes('a:c', $ns)) {
      $vNode = $c.SelectSingleNode('a:v', $ns)
      $value = if ($vNode) { $vNode.InnerText } else { '' }

      if ($c.t -eq 's' -and $value -ne '') {
        $value = $shared[[int]$value]
      } elseif ($c.t -eq 'inlineStr') {
        $value = $c.SelectSingleNode('a:is', $ns).InnerText
      }

      if ($value -ne '') {
        $col = ([regex]::Match($c.r, '^[A-Z]+')).Value
        $cells[$col] = $value
      }
    }

    if ($cells.ContainsKey('A')) {
      $rows += [pscustomobject]@{
        ID = [string]$cells['A']
        Name = [string]$cells['B']
        Phone = [string]$cells['C']
      }
    }
  }

  return $rows
}

$tempPath = 'C:\Users\Sonia Zebaze\Desktop\Temporary_Olfactory_Test_Patient_Database_Bilingual.xlsx'
$cogniPath = 'C:\Users\Sonia Zebaze\Desktop\CogniScent_14_Item_Olfactory_Assessment_Database.xlsx'
$tmpCopy = Join-Path $env:TEMP 'Temporary_Olfactory_Test_Patient_Database_Bilingual_livecopy.xlsx'
Copy-Item $tempPath $tmpCopy -Force

$tempRows = Read-PatientRows -Path $tmpCopy -HeaderRow 1
$cogniRows = Read-PatientRows -Path $cogniPath -HeaderRow 3

$tempById = @{}
foreach ($r in $tempRows) { $tempById[$r.ID] = $r }
$cogniById = @{}
foreach ($r in $cogniRows) { $cogniById[$r.ID] = $r }

$tempIds = @($tempById.Keys | Sort-Object)
$cogniIds = @($cogniById.Keys | Sort-Object)
$commonIds = @($tempIds | Where-Object { $cogniById.ContainsKey($_) })
$tempOnly = @($tempIds | Where-Object { -not $cogniById.ContainsKey($_) })
$cogniOnly = @($cogniIds | Where-Object { -not $tempById.ContainsKey($_) })

$nameMismatches = @()
$phoneMismatches = @()
foreach ($id in $commonIds) {
  if (($tempById[$id].Name -ne $cogniById[$id].Name) -and $tempById[$id].Name -and $cogniById[$id].Name) {
    $nameMismatches += [pscustomobject]@{ ID = $id; TEMP_Name = $tempById[$id].Name; COGNI_Name = $cogniById[$id].Name }
  }

  if (($tempById[$id].Phone -ne $cogniById[$id].Phone) -and $tempById[$id].Phone -and $cogniById[$id].Phone) {
    $phoneMismatches += [pscustomobject]@{ ID = $id; TEMP_Phone = $tempById[$id].Phone; COGNI_Phone = $cogniById[$id].Phone }
  }
}

Write-Output ("TEMP_COUNT={0}" -f $tempRows.Count)
Write-Output ("COGNI_COUNT={0}" -f $cogniRows.Count)
Write-Output ("COMMON_IDS={0}" -f $commonIds.Count)
Write-Output ("TEMP_ONLY_IDS={0}" -f $tempOnly.Count)
Write-Output ("COGNI_ONLY_IDS={0}" -f $cogniOnly.Count)
Write-Output ("NAME_MISMATCHES={0}" -f $nameMismatches.Count)
Write-Output ("PHONE_MISMATCHES={0}" -f $phoneMismatches.Count)

if ($tempOnly.Count -gt 0) {
  Write-Output 'TEMP_ONLY_SAMPLE:'
  $tempOnly | Select-Object -First 10 | ForEach-Object { Write-Output $_ }
}

if ($cogniOnly.Count -gt 0) {
  Write-Output 'COGNI_ONLY_SAMPLE:'
  $cogniOnly | Select-Object -First 10 | ForEach-Object { Write-Output $_ }
}

if ($nameMismatches.Count -gt 0) {
  Write-Output 'NAME_MISMATCH_SAMPLE:'
  $nameMismatches | Select-Object -First 10 | ForEach-Object { Write-Output ("{0} | {1} <> {2}" -f $_.ID, $_.TEMP_Name, $_.COGNI_Name) }
}

if ($phoneMismatches.Count -gt 0) {
  Write-Output 'PHONE_MISMATCH_SAMPLE:'
  $phoneMismatches | Select-Object -First 10 | ForEach-Object { Write-Output ("{0} | {1} <> {2}" -f $_.ID, $_.TEMP_Phone, $_.COGNI_Phone) }
}
