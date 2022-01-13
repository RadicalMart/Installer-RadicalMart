<?php defined('_JEXEC') or die;

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Radicalinstaller\Config;

extract($displayData);

HTMLHelper::_('stylesheet', 'plg_installer_radicalinstaller/main.css', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_radicalinstaller/utils.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_radicalinstaller/main.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

$langs = [
	'button_close'                       => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_CLOSE'),
	'button_update'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_UPDATE'),
	'button_update_all'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_UPDATE_ALL'),
	'button_update_check'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_UPDATE_CHECK'),
	'button_update_select'               => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_UPDATE_SELECT'),
	'button_extensions_all'              => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_EXTENSIONS_ALL'),
	'button_extensions'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_EXTENSIONS'),
	'button_extensions_my'               => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_EXTENSIONS_MY'),
	'button_plugins'                     => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_PLUGINS'),
	'button_radicalmart'                 => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_RADICALMART'),
	'button_radicalmart_pay'             => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_RADICALMART_PAY'),
	'button_radicalmart_messages'        => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_RADICALMART_MESSAGES'),
	'button_radicalmartexpress'          => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_RADICALMARTEXPRESS'),
	'button_radicalmartexpress_pay'      => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_RADICALMARTEXPRESS_PAY'),
	'button_radicalmartexpress_messages' => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_RADICALMARTEXPRESS_MESSAGES'),
	'button_support'                     => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_SUPPORT'),
	'button_support_site'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_SUPPORT_SITE'),
	'button_support_email'               => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_SUPPORT_EMAIL'),
	'button_support_telegram'            => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_SUPPORT_TELEGRAM'),
	'button_support_add'                 => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_SUPPORT_ADD'),
	'button_install'                     => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_INSTALL'),
	'button_buy'                         => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_BUY'),
	'button_installed'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_INSTALLED'),
	'button_more'                        => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_MORE'),
	'button_reinstall'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_REINSTALL'),
	'button_docs'                        => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_DOCS'),
	'button_extension_website'           => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_EXTENSION_WEBSITE'),
	'button_contacts'                    => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_CONTACTS'),
	'button_forum'                       => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_FORUM'),
	'button_telegram'                    => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_TELEGRAM'),
	'button_need_api_key'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_NEED_API_KEY'),
	'button_load_more'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_LOAD_MORE'),
	'button_disable'                     => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_DISABLE'),
	'button_enable'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_ENABLE'),
	'button_delete'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_DELETE'),
	'button_view'                        => Text::_('PLG_INSTALLER_RADICALINSTALLER_BUTTON_VIEW'),
	'providers'                          => Text::_('PLG_INSTALLER_RADICALINSTALLER_PROVIDERS'),
	'provider'                           => Text::_('PLG_INSTALLER_RADICALINSTALLER_PROVIDER'),
	'description'                        => Text::_('PLG_INSTALLER_RADICALINSTALLER_DESCRIPTION'),
	'extension_installed'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_EXTENSION_INSTALLED'),
	'extension_updates'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_EXTENSION_UPDATES'),
	'will_be_installed'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_WILL_BE_INSTALLED'),
	'support'                            => Text::_('PLG_INSTALLER_RADICALINSTALLER_SUPPORT'),
	'installing_an_extension'            => Text::_('PLG_INSTALLER_RADICALINSTALLER_INSTALLING_AN_EXTENSION'),
	'delete_an_extension'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_DELETE_AN_EXTENSION'),
	'extension_name'                     => Text::_('PLG_INSTALLER_RADICALINSTALLER_EXTENSION_NAME'),
	'status'                             => Text::_('PLG_INSTALLER_RADICALINSTALLER_STATUS'),
	'wait'                               => Text::_('PLG_INSTALLER_RADICALINSTALLER_WAIT'),
	'installation_error'                 => Text::_('PLG_INSTALLER_RADICALINSTALLER_INSTALLATION_ERROR'),
	'try_again'                          => Text::_('PLG_INSTALLER_RADICALINSTALLER_TRY_AGAIN'),
	'hide_messages'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_HIDE_MESSAGES'),
	'show_messages'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_SHOW_MESSAGES'),
	'updating'                           => Text::_('PLG_INSTALLER_RADICALINSTALLER_UPDATING'),
	'update'                             => Text::_('PLG_INSTALLER_RADICALINSTALLER_UPDATE'),
	'current_version'                    => Text::_('PLG_INSTALLER_RADICALINSTALLER_CURRENT_VERSION'),
	'new_version'                        => Text::_('PLG_INSTALLER_RADICALINSTALLER_NEW_VERSION'),
	'no_updates'                         => Text::_('PLG_INSTALLER_RADICALINSTALLER_NO_UPDATES'),
	'no_installed'                       => Text::_('PLG_INSTALLER_RADICALINSTALLER_NO_INSTALLED'),
	'text_header_scan_extension'         => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_HEADER_SCAN_EXTENSION'),
	'text_scan_extension'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_SCAN_EXTENSION'),
	'text_no_description'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_NO_DESCRIPTION'),
	'text_new_updated'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_NEW_UPDATED'),
	'question_extension_delete'          => Text::_('PLG_INSTALLER_RADICALINSTALLER_QUESTION_EXTENSION_DELETE'),
	'error_key'                          => Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_KEY'),
	'error_service'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_SERVICE'),
	'error_install'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_INSTALL'),
	'error_uninstall'                    => Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_UNINSTALL'),
	'error_check_main_extensions'        => Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_CHECK_MAIN_EXTENSIONS'),
];
?>

<div id="radicalinstaller-container"></div>

<script type="text/javascript">
    document.addEventListener("DOMContentLoaded", function () {
        window.RadicalInstallerConfig = {
            api: '<?php echo Config::$scheme . '://' . Config::$host ?>',
            key: '<?php echo $params->get('apikey', '')?>'
        };
        window.RadicalInstallerLangs = <?php echo json_encode($langs) ?>;
        RadicalInstaller.init();
    });
</script>
