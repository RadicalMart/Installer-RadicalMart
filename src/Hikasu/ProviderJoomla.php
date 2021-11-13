<?php namespace Hikasu;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;

/**
 * Class ProviderJoomla
 */
class ProviderJoomla implements ProviderInterface
{

	protected $config = [];


	public function __construct($config = [])
	{
		Table::addIncludePath(JPATH_ROOT . '/plugins/installer/hikasu/tables');
		$this->scheme = Config::$scheme;
		$this->host   = Config::$host;
		$this->config = $config;
	}


	public function start($id)
	{
		$app     = Factory::getApplication();
		$input   = $app->input;
		$project = json_decode(API::project($id), JSON_OBJECT_AS_ARRAY);
		$url     = $this->scheme . '://' . $this->host . $project['download'];

		if(isset($this->config['api_key']))
		{
			$url .= ((strpos($url, '?') === false ? '?' : '&')) . 'download_key=' . $this->config['api_key'];
		}

		$input->set('installtype', 'url');
		$input->set('install_url', $url);

		Factory::getApplication()->getLanguage()->load('com_installer');
		\JModelLegacy::addIncludePath(JPATH_ROOT . '/administrator/components/com_installer/models');
		$model  = \JModelLegacy::getInstance('Install', 'InstallerModel');
		$result = $model->install();

		if ($result)
		{
			//проверяем что поставила джумла на расширение
			$type  = $project['joomla']['type'];
			$db    = Factory::getDbo();
			$query = $db->getQuery(true);
			$query->select(['manifest_cache', 'enabled']);
			$query->from('#__extensions');
			$query->where($db->quoteName('type') . '=' . $db->quote($type));
			$query->where($db->quoteName('element') . '=' . $db->quote($project['element']));
			$extension_joomla = $db->setQuery($query)->loadObject();
			$manifest_cache   = new Registry($extension_joomla->manifest_cache);
			$version          = $manifest_cache->get('version');

			if (isset($project['version'], $project['version']['version']))
			{
				$version = $project['version']['version'];
			}

			$hikasu = Table::getInstance('HikasuInstall', 'Table');
			$hikasu->load(['element' => $project['element']]);
			$hikasu->type       = $project['install'];
			$hikasu->title      = $project['title'];
			$hikasu->element    = $project['element'];
			$hikasu->version    = $version;
			$hikasu->project_id = $project['id'];
			$hikasu->enable     = isset($extension_joomla->enabled) ? (int) $extension_joomla->enabled : 0;
			$hikasu->params     = '{}';

			if (!$hikasu->check())
			{
				//Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_ZIP_EXTRACT'), Log::ERROR, 'plg_system_uikithikashop');
			}

			if (!$hikasu->store())
			{
				//Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_ZIP_EXTRACT'), Log::ERROR, 'plg_system_uikithikashop');
			}

		}

		return $result;
	}


	public function delete($id)
	{
	}

	public function toggleEnable($id)
	{

	}


	private function checkToken($method = 'post', $redirect = true)
	{
		$valid = Session::checkToken($method);
		$app   = Factory::getApplication();

		if (!$valid && $redirect)
		{
			$referrer = $app->input->server->getString('HTTP_REFERER');

			if (!Uri::isInternal($referrer))
			{
				$referrer = 'index.php';
			}

			$app = Factory::getApplication();
			$app->enqueueMessage(Text::_('JINVALID_TOKEN_NOTICE'), 'warning');

			return false;
		}

		return $valid;
	}

}