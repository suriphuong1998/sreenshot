local resourceName = GetCurrentResourceName()

local b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local b64lookup = {}

for i = 1, #b64chars do
    b64lookup[b64chars:sub(i, i)] = i - 1
end

local function decodeBase64(data)
    data = tostring(data or ''):gsub('%s+', ''):gsub('=', '')
    local chunks = {}
    local chunk = {}
    local chunkLen = 0
    local buf, bits = 0, 0

    for i = 1, #data do
        local value = b64lookup[data:sub(i, i)]
        if value then
            buf = buf * 64 + value
            bits = bits + 6
            if bits >= 8 then
                bits = bits - 8
                chunkLen = chunkLen + 1
                chunk[chunkLen] = string.char(math.floor(buf / (2 ^ bits)) % 256)
                buf = buf % (2 ^ bits)
                if chunkLen >= 4096 then
                    chunks[#chunks + 1] = table.concat(chunk)
                    chunk = {}
                    chunkLen = 0
                end
            end
        end
    end

    if chunkLen > 0 then
        chunks[#chunks + 1] = table.concat(chunk, '', 1, chunkLen)
    end

    return table.concat(chunks)
end

local function sanitizeRelativePath(rel)
    rel = tostring(rel or ''):gsub('\\', '/'):gsub('^/+', '')
    if rel == '' or rel:find('%.%.', 1, true) or rel:match('^%a:') then
        return nil
    end
    if not rel:match('^images/') then
        rel = ('images/%s'):format(rel)
    end
    return rel
end

local function flattenPath(rel)
    local name = rel:gsub('^images/', ''):gsub('/', '_')
    return ('images/%s'):format(name)
end

local function savePng(relativePath, base64)
    local rel = sanitizeRelativePath(relativePath)
    if not rel then
        return false, 'invalid-path'
    end

    local bytes = decodeBase64(base64)
    if not bytes or #bytes == 0 then
        return false, 'empty-image'
    end

    if SaveResourceFile(resourceName, rel, bytes, #bytes) then
        return true, rel
    end

    local fallback = flattenPath(rel)
    if fallback ~= rel and SaveResourceFile(resourceName, fallback, bytes, #bytes) then
        return true, fallback
    end

    return false, rel
end

exports('SavePngBase64', function(relativePath, base64)
    local ok, savedAs = savePng(relativePath, base64)
    return {
        ok = ok,
        savedAs = savedAs,
    }
end)
