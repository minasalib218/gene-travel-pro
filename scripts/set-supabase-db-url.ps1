param(
  [Parameter(Mandatory = $true)]
  [string]$Password
)

$encodedPassword = [System.Uri]::EscapeDataString($Password)
$databaseUrl = "postgresql://postgres.igqsznadqigliqpxjtez:$encodedPassword@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

$envPath = Join-Path $PSScriptRoot "..\.env"
$envPath = [System.IO.Path]::GetFullPath($envPath)

if (-not (Test-Path $envPath)) {
  throw ".env file not found at $envPath"
}

$content = Get-Content $envPath -Raw

if ($content -match '(?m)^POSTGRES_PRISMA_URL=') {
  $content = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    '(?m)^POSTGRES_PRISMA_URL=.*$',
    ('POSTGRES_PRISMA_URL="' + $databaseUrl + '"')
  )
} else {
  $content = $content.TrimEnd() + [Environment]::NewLine + 'POSTGRES_PRISMA_URL="' + $databaseUrl + '"' + [Environment]::NewLine
}

Set-Content -Path $envPath -Value $content

Write-Output "POSTGRES_PRISMA_URL updated in .env"
