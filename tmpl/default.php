<?php defined('_JEXEC') or die;

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Version;
use Radicalinstaller\Config;

extract($displayData);

HTMLHelper::_('stylesheet', 'plg_installer_radicalinstaller/main.css', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);


if ((new Version())->isCompatible('4.0'))
{
	HTMLHelper::_('stylesheet', 'plg_installer_radicalinstaller/joomla4.css', [
		'version'  => filemtime(__FILE__),
		'relative' => true
	]);
}
else
{
	HTMLHelper::_('stylesheet', 'plg_installer_radicalinstaller/joomla3.css', [
		'version'  => filemtime(__FILE__),
		'relative' => true
	]);
}

HTMLHelper::_('script', 'plg_installer_radicalinstaller/utils.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_radicalinstaller/app.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_radicalinstaller/ui.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_radicalinstaller/project.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

$langs = [
	'group_key'                 => Text::_('PLG_INSTALLER_RADICALINSTALLER_GROUP_KEY'),
	'group_free'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_GROUP_FREE'),
	'group_main'                => Text::_('PLG_INSTALLER_RADICALINSTALLER_GROUP_MAIN'),
	'group_other'               => Text::_('PLG_INSTALLER_RADICALINSTALLER_GROUP_OTHER'),
	'api_key'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_API_KEY'),
	'need_key'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_NEED_KEY'),
	'home'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_HOME'),
	'category'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_CATEGORY'),
	'updated'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_UPDATED'),
	'updated_new'               => Text::_('PLG_INSTALLER_RADICALINSTALLER_UPDATED_NEW'),
	'update'                    => Text::_('PLG_INSTALLER_RADICALINSTALLER_UPDATE'),
	'sync'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_SYNC'),
	'docs'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_DOCS'),
	'support'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_SUPPORT'),
	'message_close'             => Text::_('PLG_INSTALLER_RADICALINSTALLER_MESSAGE_CLOSE'),
	'installed'                 => Text::_('PLG_INSTALLER_RADICALINSTALLER_INSTALLED'),
	'install'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_INSTALL'),
	'install_process'           => Text::_('PLG_INSTALLER_RADICALINSTALLER_INSTALL_PROCESS'),
	'install_all'               => Text::_('PLG_INSTALLER_RADICALINSTALLER_INSTALL_ALL'),
	'install_meta'              => Text::_('PLG_INSTALLER_RADICALINSTALLER_INSTALL_META'),
	'reinstall'                 => Text::_('PLG_INSTALLER_RADICALINSTALLER_REINSTALL'),
	'delete'                    => Text::_('PLG_INSTALLER_RADICALINSTALLER_DELETE'),
	'delete_process'            => Text::_('PLG_INSTALLER_RADICALINSTALLER_DELETE_PROCESS'),
	'key_view'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_KEY_VIEW'),
	'save'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_SAVE'),
	'clean'                     => Text::_('PLG_INSTALLER_RADICALINSTALLER_CLEAN'),
	'view'                      => Text::_('PLG_INSTALLER_RADICALINSTALLER_VIEW'),
	'view_all'                  => Text::_('PLG_INSTALLER_RADICALINSTALLER_VIEW_ALL'),
	'version'                   => Text::_('PLG_INSTALLER_RADICALINSTALLER_VERSION'),
	'description'               => Text::_('PLG_INSTALLER_RADICALINSTALLER_DESCRIPTION'),
	'description_no'            => Text::_('PLG_INSTALLER_RADICALINSTALLER_DESCRIPTION_NO'),
	'alert_service_error'       => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_SERVICE_ERROR'),
	'text_key_error'            => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_KEY_ERROR'),
	'text_sync'                 => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_SYNC'),
	'text_updated_new'          => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_UPDATED_NEW'),
	'text_updated'              => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_UPDATED_NO'),
	'text_updated_force'        => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_UPDATED_FORCE'),
	'text_updated_force_error'  => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_UPDATED_FORCE_ERROR'),
	'text_updated_no'           => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_UPDATED_NO'),
	'text_installed_no'         => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_INSTALLED_NO'),
	'text_installed_meta'       => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_INSTALLED_META'),
	'text_installed_meta_error' => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_INSTALLED_META_ERROR'),
	'text_install_error'        => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_INSTALL_ERROR'),
	'text_delete_error'         => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_DELETE_ERROR'),
	'text_input_key'            => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_INPUT_KEY'),
	'text_question_delete'      => Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT_QUESTION_DELETE'),
];
?>

<?php if ((new Version())->isCompatible('4.0')) : ?>
    <legend><?php echo Text::_('PLG_INSTALLER_RADICALINSTALLER_LEGEND'); ?></legend>
<?php endif; ?>

<div id="radicalinstaller-container">
    <div class="radicalinstaller-form-key radicalinstaller-margin-bottom"></div>
    <div class="radicalinstaller-toolbar radicalinstaller-margin-bottom"></div>
    <div class="radicalinstaller-page">
        <img src="/media/plg_installer_radicalinstaller/img/loader.svg"/>
    </div>
</div>
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
