<?php
/**
 * Whop licence validation.
 *
 * The app is a static build and cannot hold a secret, so this is the one piece
 * of server code in the product: it holds the Whop API key and proxies a single
 * check. Hostinger serves PHP, so no separate runtime is needed.
 *
 * Contract with the client (src/lib/license.ts):
 *   POST { "key": "XXXX-XXXX-XXXX" }
 *   200  { "valid": true }   -> let them in
 *   200  { "valid": false }  -> key not recognised
 *   any other status         -> the client treats it as "couldn't run, retry",
 *                               and never as a rejection. A paying customer must
 *                               not be locked out because this endpoint is down.
 */

declare(strict_types=1);

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method']);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    // Misconfigured deploy. 503, not "invalid" — see the contract above.
    http_response_code(503);
    echo json_encode(['error' => 'unconfigured']);
    exit;
}
$config = require $configPath;
$apiKey = $config['whop_api_key'] ?? '';
if ($apiKey === '') {
    http_response_code(503);
    echo json_encode(['error' => 'unconfigured']);
    exit;
}

$body = json_decode(file_get_contents('php://input') ?: '', true);
$key  = is_array($body) ? trim((string)($body['key'] ?? '')) : '';

// Shape check before spending an upstream call, and it keeps anything
// path-unsafe out of the URL below.
if ($key === '' || !preg_match('/^[A-Za-z0-9]{4,}(-[A-Za-z0-9]{4,}){1,4}$/', $key)) {
    echo json_encode(['valid' => false]);
    exit;
}

$url = 'https://api.whop.com/api/v2/memberships/' . rawurlencode($key) . '/validate_license';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    // Empty metadata on purpose. Whop compares stored metadata and answers 400
    // on a mismatch, which is how device binding is built — and section 4 of the
    // spec rules device binding out, so there is nothing to mismatch.
    CURLOPT_POSTFIELDS     => '{"metadata":{}}',
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_CONNECTTIMEOUT => 5,
]);
$response = curl_exec($ch);
$status   = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$failed   = $response === false;
curl_close($ch);

if ($failed || $status === 0) {
    // Upstream unreachable. Retryable, never a rejection.
    http_response_code(502);
    echo json_encode(['error' => 'upstream']);
    exit;
}

// 201 is the documented success. 400 is a metadata mismatch and 404 is an
// unknown key — both mean "not a valid licence".
if ($status >= 200 && $status < 300) {
    echo json_encode(['valid' => true]);
    exit;
}
if ($status === 400 || $status === 404) {
    echo json_encode(['valid' => false]);
    exit;
}

// 401/403 means OUR key is wrong, not theirs. Never reject the customer for it.
http_response_code(502);
echo json_encode(['error' => 'upstream']);
