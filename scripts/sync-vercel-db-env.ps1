$wanted = @(
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'POSTGRES_PRISMA_URL'
)

$map = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$') {
    $name = $matches[1]
    $value = $matches[2].Trim()
    if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$name] = $value
  }
}

foreach ($key in $wanted) {
  if ($map.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace($map[$key])) {
    npx.cmd vercel@latest env add $key production --force --yes --value $map[$key] --scope gene-travel | Out-Null
  }
}

Write-Output 'done'
