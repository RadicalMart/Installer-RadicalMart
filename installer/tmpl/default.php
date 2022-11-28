<?php defined('_JEXEC') or die;

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Version;
use Sovmart\Config;

extract($displayData);

HTMLHelper::_('stylesheet', 'plg_installer_sovmart/main.css', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);


if ((new Version())->isCompatible('4.0'))
{
	HTMLHelper::_('stylesheet', 'plg_installer_sovmart/joomla4.css', [
		'version'  => filemtime(__FILE__),
		'relative' => true
	]);
}
else
{
	HTMLHelper::_('stylesheet', 'plg_installer_sovmart/joomla3.css', [
		'version'  => filemtime(__FILE__),
		'relative' => true
	]);
}

HTMLHelper::_('script', 'plg_installer_sovmart/utils.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_sovmart/app.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_sovmart/ui.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

HTMLHelper::_('script', 'plg_installer_sovmart/project.js', [
	'version'  => filemtime(__FILE__),
	'relative' => true
]);

$langs = [
	'group_key'                 => Text::_('PLG_INSTALLER_SOVMART_GROUP_KEY'),
	'group_free'                => Text::_('PLG_INSTALLER_SOVMART_GROUP_FREE'),
	'group_paid'                => Text::_('PLG_INSTALLER_SOVMART_GROUP_PAID'),
	'group_main'                => Text::_('PLG_INSTALLER_SOVMART_GROUP_MAIN'),
	'group_other'               => Text::_('PLG_INSTALLER_SOVMART_GROUP_OTHER'),
	'api_key'                   => Text::_('PLG_INSTALLER_SOVMART_API_KEY'),
	'need_key'                  => Text::_('PLG_INSTALLER_SOVMART_NEED_KEY'),
	'home'                      => Text::_('PLG_INSTALLER_SOVMART_HOME'),
	'category'                  => Text::_('PLG_INSTALLER_SOVMART_CATEGORY'),
	'updated'                   => Text::_('PLG_INSTALLER_SOVMART_UPDATED'),
	'updated_new'               => Text::_('PLG_INSTALLER_SOVMART_UPDATED_NEW'),
	'update'                    => Text::_('PLG_INSTALLER_SOVMART_UPDATE'),
	'sync'                      => Text::_('PLG_INSTALLER_SOVMART_SYNC'),
	'docs'                      => Text::_('PLG_INSTALLER_SOVMART_DOCS'),
	'support'                   => Text::_('PLG_INSTALLER_SOVMART_SUPPORT'),
	'message_close'             => Text::_('PLG_INSTALLER_SOVMART_MESSAGE_CLOSE'),
	'installed'                 => Text::_('PLG_INSTALLER_SOVMART_INSTALLED'),
	'install'                   => Text::_('PLG_INSTALLER_SOVMART_INSTALL'),
	'install_process'           => Text::_('PLG_INSTALLER_SOVMART_INSTALL_PROCESS'),
	'install_all'               => Text::_('PLG_INSTALLER_SOVMART_INSTALL_ALL'),
	'install_meta'              => Text::_('PLG_INSTALLER_SOVMART_INSTALL_META'),
	'reinstall'                 => Text::_('PLG_INSTALLER_SOVMART_REINSTALL'),
	'delete'                    => Text::_('PLG_INSTALLER_SOVMART_DELETE'),
	'delete_process'            => Text::_('PLG_INSTALLER_SOVMART_DELETE_PROCESS'),
	'key_view'                  => Text::_('PLG_INSTALLER_SOVMART_KEY_VIEW'),
	'save'                      => Text::_('PLG_INSTALLER_SOVMART_SAVE'),
	'clean'                     => Text::_('PLG_INSTALLER_SOVMART_CLEAN'),
	'view'                      => Text::_('PLG_INSTALLER_SOVMART_VIEW'),
	'view_all'                  => Text::_('PLG_INSTALLER_SOVMART_VIEW_ALL'),
	'version'                   => Text::_('PLG_INSTALLER_SOVMART_VERSION'),
	'description'               => Text::_('PLG_INSTALLER_SOVMART_DESCRIPTION'),
	'description_no'            => Text::_('PLG_INSTALLER_SOVMART_DESCRIPTION_NO'),
	'search'                    => Text::_('PLG_INSTALLER_SOVMART_SEARCH'),
	'alert_service_error'       => Text::_('PLG_INSTALLER_SOVMART_TEXT_SERVICE_ERROR'),
	'text_key_error'            => Text::_('PLG_INSTALLER_SOVMART_TEXT_KEY_ERROR'),
	'text_sync'                 => Text::_('PLG_INSTALLER_SOVMART_TEXT_SYNC'),
	'text_updated_new'          => Text::_('PLG_INSTALLER_SOVMART_TEXT_UPDATED_NEW'),
	'text_updated'              => Text::_('PLG_INSTALLER_SOVMART_TEXT_UPDATED_NO'),
	'text_updated_force'        => Text::_('PLG_INSTALLER_SOVMART_TEXT_UPDATED_FORCE'),
	'text_updated_force_error'  => Text::_('PLG_INSTALLER_SOVMART_TEXT_UPDATED_FORCE_ERROR'),
	'text_updated_no'           => Text::_('PLG_INSTALLER_SOVMART_TEXT_UPDATED_NO'),
	'text_installed_no'         => Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALLED_NO'),
	'text_installed_meta'       => Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALLED_META'),
	'text_installed_meta_error' => Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALLED_META_ERROR'),
	'text_install_error'        => Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'),
	'text_delete_error'         => Text::_('PLG_INSTALLER_SOVMART_TEXT_DELETE_ERROR'),
	'text_input_key'            => Text::_('PLG_INSTALLER_SOVMART_TEXT_INPUT_KEY'),
	'text_question_delete'      => Text::_('PLG_INSTALLER_SOVMART_TEXT_QUESTION_DELETE'),
	'text_search_error_small'   => Text::_('PLG_INSTALLER_SOVMART_TEXT_SEARCH_ERROR_SMALL'),
	'text_search_by'            => Text::_('PLG_INSTALLER_SOVMART_TEXT_SEARCH_BY'),
];
?>

<?php if ((new Version())->isCompatible('4.0')) : ?>
    <legend><?php echo Text::_('PLG_INSTALLER_SOVMART_LEGEND'); ?></legend>
<?php endif; ?>

<div id="radicalinstaller-container">
    <div class="radicalinstaller-form-key radicalinstaller-margin-bottom"></div>
    <div class="radicalinstaller-toolbar radicalinstaller-margin-bottom"></div>
    <div class="radicalinstaller-page">
        <div class="radicalinstaller-loader radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-middle">
            <img src="/media/plg_installer_sovmart/img/loader.svg"/>
        </div>
    </div>
</div>
<script type="text/javascript">
    document.addEventListener("DOMContentLoaded", function () {
        window.SovmartConfig = {
            api: '<?php echo Config::$scheme . '://' . Config::$host ?>',
            key: '<?php echo $params->get('apikey', '')?>'
        };
        window.SovmartLangs = <?php echo json_encode($langs) ?>;
        Sovmart.init();
    });
</script>
