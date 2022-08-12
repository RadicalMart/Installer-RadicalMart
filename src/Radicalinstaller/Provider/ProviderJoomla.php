<?php namespace Radicalinstaller\Provider;

defined('_JEXEC') or die;

use Exception;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;
use Radicalinstaller\API;
use Radicalinstaller\Config;

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
		$model = \JModelLegacy::getInstance('Install', 'InstallerModel');

		try
		{

			$result = $model->install();

			if ($result)
			{
				//проверяем что поставила джумла на расширение
				$type    = $project['joomla']['type'];
				$element = $project['joomla']['element'];
				$folder  = $project['joomla']['folder'];

				$db    = Factory::getDbo();
				$query = $db->getQuery(true);
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
				$table->load([
					'provider' => $project['provider'],
					'type'     => $type,
					'element'  => $element,
					'folder'   => $folder
				]);

				$table->provider       = $project['provider'];
				$table->title          = $project['title'];
				$table->type           = $type;
				$table->element        = $element;
				$table->folder         = $folder;
				$table->version        = $version;
				$table->project_id     = $project['id'];
				$table->category_title = $project['title'];
				$table->extension_id   = $extension_joomla->extension_id;

				if (!$table->check())
				{
					return false;
				}

				if (!$table->store())
				{
					return false;
				}

			}
		}
		catch (Exception $e)
		{
			$result = false;
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


	public function getMessages()
	{
		$app      = Factory::getApplication();
		$messages = [];

		$message           = $app->getUserState('com_installer.message', '');
		$extension_message = $app->getUserState('com_installer.extension_message', '');

		if ($message)
		{
			$messages[] = ['message' => $app->getUserState('com_installer.message', ''), 'type' => 'info'];
			$app->setUserState('com_installer.message', '');
		}

		if ($extension_message)
		{
			$messages[] = ['message' => $app->getUserState('com_installer.extension_message', ''), 'type' => 'info'];
			$app->setUserState('com_installer.extension_message', '');
		}

		return $messages;
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


	public function toggleDisable($id)
	{
		// TODO: Implement toggleDisable() method.
	}


}