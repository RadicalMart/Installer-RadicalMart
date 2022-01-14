<?php namespace Radicalinstaller;

defined('_JEXEC') or die;

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
		Table::addIncludePath(JPATH_ROOT . '/plugins/installer/radicalinstaller/tables');
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

		if (isset($this->config['api_key']))
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
			$type    = $project['joomla']['type'];
			$element = $project['joomla']['element'];
			$db      = Factory::getDbo();
			$query   = $db->getQuery(true);
			$query->select(['extension_id', 'folder', 'manifest_cache', 'enabled']);
			$query->from('#__extensions');
			$query->where($db->quoteName('type') . '=' . $db->quote($type));
			$query->where($db->quoteName('element') . '=' . $db->quote($element));
			$extension_joomla = $db->setQuery($query)->loadObject();
			$manifest_cache   = new Registry($extension_joomla->manifest_cache);
			$version          = $manifest_cache->get('version');

			if (isset($project['version']['version']))
			{
				$version = $project['version']['version'];
			}

			$table = Table::getInstance('RadicalinstallerExtensions', 'Table');
			$table->load(['element' => $project['element']]);
			$table->type         = $project['install'];
			$table->title        = $project['title'];
			$table->element      = $project['element'];
			$table->folder       = $extension_joomla->folder;
			$table->version      = $version;
			$table->project_id   = $project['id'];
			$table->extension_id = $extension_joomla->extension_id;

			if (!$table->check())
			{
			}

			if (!$table->store())
			{
			}

		}

		return $result;
	}


	public function delete($id)
	{

		$table = Table::getInstance('RadicalinstallerExtensions', 'Table');
		$table->load(['project_id' => $id]);
		Factory::getApplication()->getLanguage()->load('com_installer');
		\JModelLegacy::addIncludePath(JPATH_ROOT . '/administrator/components/com_installer/models');
		$model  = \JModelLegacy::getInstance('Manage', 'InstallerModel');
		$result = $model->remove([$table->extension_id]);

		return $result;
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