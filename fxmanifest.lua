fx_version 'cerulean'
game 'gta5'

author 'MrIT'
description 'fivem-greenscreener'
version '1.6.5'

this_is_a_map 'yes'
data_file 'DLC_ITYP_REQUEST' 'stream/jim_g_green_screen_v1.ytyp'

ui_page 'html/index.html'


files {
    'config.json',
    'html/*'
}

client_script 'client.js'

server_scripts {
    'server.lua',
    'server.js'
}

dependencies {
	'screenshot-basic',
    'yarn'
}
