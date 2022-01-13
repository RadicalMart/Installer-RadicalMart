<?php defined('_JEXEC') or die;

use Joomla\CMS\Cache\Cache;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\Plugin\CMSPlugin;
use Radicalinstaller\API;
use Radicalinstaller\ProviderJoomla;

/**
 * PlgInstallerRadicalinstaller Plugin.
 *
 */
class PlgInstallerRadicalinstaller extends CMSPlugin
{


	protected $app;


	protected $db;


	protected $autoloadLanguage = true;


	public function onInstallerAddInstallationTab()
	{
		JLoader::registerNamespace('Radicalinstaller', __DIR__ . DIRECTORY_SEPARATOR . 'src');

		$tab          = [];
		$tab['name']  = 'radicalinstaller';
		$tab['label'] = Text::_('PLG_INSTALLER_RADICALINSTALLER_TEXT');

		$content        = new FileLayout('default', JPATH_ROOT . '/plugins/installer/radicalinstaller/tmpl');
		$tab['content'] = $content->render(['params' => $this->params]);

		return $tab;
	}


	public function onExtensionAfterUninstall($installer, $identifier, $result)
	{
		if (!$result)
		{
			return;
		}

		$query      = $this->db->getQuery(true);
		$conditions = [
			$this->db->quoteName('extension_id') . ' = ' . (int) $identifier,
		];
		$query->delete($this->db->quoteName('#__radicalinstaller_extensions'));
		$query->where($conditions);
		$this->db->setQuery($query);
		$this->db->execute();
	}


	public function onAjaxRadicalinstaller()
	{
		JLoader::registerNamespace('Radicalinstaller', __DIR__ . DIRECTORY_SEPARATOR . 'src');
		$app    = Factory::getApplication();
		$method = $app->input->get('method');
		$output = '';

		if (!$app->isClient('administrator'))
		{
			return false;
		}

		try
		{
			if ($method === 'categories')
			{
				$output = $this->APICategories();
			}

			if ($method === 'projects')
			{
				$output = $this->APIProjects();
			}

			if ($method === 'projectList')
			{
				$output = $this->APIProjectList();
			}

			if ($method === 'project')
			{
				$output = $this->APIProject();
			}

			if ($method === 'getForInstallDepends')
			{
				$output = $this->APIGetForInstallDepends();
			}

			if ($method === 'installJoomla')
			{
				$output = $this->installJoomla();
			}

			if ($method === 'deleteJoomla')
			{
				$output = $this->deleteJoomla();
			}

			if ($method === 'checkMainExtension')
			{
				$output = $this->checkMainExtension();
			}

			if ($method === 'checkInstall')
			{
				$output = $this->checkInstall();
			}

			if ($method === 'checkUpdates')
			{
				$output = $this->checkUpdates();
			}

			if ($method === 'installedList')
			{
				$output = $this->installedList();
			}

			if ($method === 'toggleEnabled')
			{
				$output = $this->toggleEnabled();
			}

			if ($method === 'saveKey')
			{
				$output = $this->saveKey();
			}
		}
		catch (Exception $e)
		{
			$output = $e->getMessage();
			$app->setHeader('status', $e->getCode(), true);
		} finally
		{
			return $output;
		}

	}


	protected function installJoomla()
	{
		$app      = Factory::getApplication();
		$input    = $app->input;
		$id       = $input->get('id', '', 'int');
		$config   = [
			'api_key' => $this->params->get('apikey', '')
		];
		$update   = new ProviderJoomla($config);
		$install  = $update->start($id);
		$messages = [];

		if ($install)
		{
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

		}

		$messages = array_merge($messages, $app->getMessageQueue());

		return json_encode(['status' => $install ? 'ok' : 'fail', 'messages' => $messages]);
	}


	protected function deleteJoomla()
	{
		$app      = Factory::getApplication();
		$input    = $app->input;
		$id       = $input->get('id', '', 'int');
		$update   = new ProviderJoomla();
		$result   = $update->delete($id);
		$messages = [];

		if ($result)
		{
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

		}

		$messages = array_merge($messages, $app->getMessageQueue());

		return json_encode(['status' => $result ? 'ok' : 'fail', 'messages' => $messages]);
	}


	protected function checkUpdates()
	{
		$ids   = [];
		$query = $this->db->getQuery(true);
		$query
			->select(['id', 'title', 'version', 'project_id'])
			->from($this->db->quoteName('#__radicalinstaller_extensions'));
		$projects_install = $this->db->setQuery($query)->loadObjectList();

		foreach ($projects_install as $project_install)
		{
			$ids[] = $project_install->project_id;
		}

		$projects_from_server = API::projectListCheckVersion($ids);
		$projects_from_server = json_decode($projects_from_server, JSON_OBJECT_AS_ARRAY);
		$projects             = [];
		$projects_for_update  = [];

		if (is_array($projects_from_server))
		{
			foreach ($projects_from_server as $project_from_server)
			{
				$projects[(int) $project_from_server['id']] = $project_from_server;
			}

			foreach ($projects_install as $project_install)
			{
				if (isset($projects[(int) $project_install->project_id]))
				{
					$version_current = (string) $project_install->version;
					$version_last    = (string) $projects[$project_install->project_id]['version']['version'];

					if (version_compare($version_last, $version_current, '>'))
					{
						$project_install->version_last = $version_last;
						$projects_for_update[]         = $project_install;
					}
				}
			}
		}

		return json_encode(['items' => $projects_for_update, 'count' => count($projects_for_update)]);
	}


	protected function APICategories()
	{
		return API::categories();
	}


	protected function APIProjects()
	{
		$id       = $this->app->input->get('category_id');
		$page     = $this->app->input->get('page', 1, 'int');
		$limit    = $this->app->input->get('limit', 12, 'int');
		$projects = API::projects($id, $page, $limit);

		return $projects;
	}


	protected function APIProjectList()
	{
		$ids      = $this->app->input->get('ids', '{}', 'raw');
		$projects = API::projectList($ids);

		return $projects;
	}


	protected function APIGetForInstallDepends()
	{
		$id       = $this->app->input->getInt('project_id');
		$projects = API::getForInstallDepends($id);

		return $projects;
	}


	protected function APIProject()
	{
		$id      = $this->app->input->get('project_id');
		$project = API::project($id);

		return $project;
	}


	protected function checkInstall()
	{
		$list             = $this->app->input->getString('list', '{}');
		$list             = json_decode($list, JSON_OBJECT_AS_ARRAY);
		$fields           = [];
		$find_list_output = [];

		foreach ($list as $value)
		{
			$fields[] = $this->db->quote($value);
		}

		$query = $this->db->getQuery(true);
		$query
			->select(['element'])
			->from($this->db->quoteName('#__radicalinstaller_extensions'))
			->where('element IN (' . implode(',', $fields) . ')');
		$find_list = $this->db->setQuery($query)->loadObjectList();

		foreach ($find_list as $find)
		{
			$find_list_output[] = $find->element;
		}

		return $find_list_output;
	}


	protected function checkMainExtension()
	{
		$projects = json_decode(API::projectsMain(), JSON_OBJECT_AS_ARRAY);
		$elements = [];
		$find     = false;

		if (!is_array($projects) || !isset($projects['items']))
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_ERROR_SERVICE'), 500);
		}
		foreach ($projects['items'] as $project)
		{
			if (isset($project['element']))
			{
				$elements[] = $this->db->q($project['element']);
			}
		}

		$query = $this->db->getQuery(true);
		$query
			->select($this->db->qn('element'))
			->from($this->db->quoteName('#__extensions'))
			->where($this->db->qn('element') . ' IN (' . implode(',', $elements) . ')');
		$find_list = $this->db->setQuery($query)->loadObjectList();

		if (count($find_list) > 0)
		{
			$find = true;
		}

		if (!$find)
		{
			return ['status' => 'notinstall', 'items' => $projects['items']];
		}

		return ['status' => 'ok'];
	}


	protected function saveKey()
	{
		$key = $this->app->input->getString('key');

		if (empty($key))
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_ERROR_KEY'), 401);
		}

		$result = json_decode(API::checkKey($key), JSON_OBJECT_AS_ARRAY);

		if (
			is_array($result) &&
			isset($result['check']) &&
			((string) $result['check'] === 'true')
		)
		{
			$this->params->set('apikey', $key);
			$query  = $this->db->getQuery(true);
			$fields = [
				$this->db->qn('params') . ' = ' . $this->db->q($this->params->toString())
			];

			$conditions = [
				$this->db->qn('element') . ' = ' . $this->db->q('radicalinstaller'),
				$this->db->qn('folder') . ' = ' . $this->db->q('installer'),
			];

			$query->update($this->db->quoteName('#__extensions'))->set($fields)->where($conditions);
			$this->db->setQuery($query);
			$result = $this->db->execute();

			if (!$result)
			{
				throw new RuntimeException(Text::_('PLG_INSTALLER_ERROR_DATABASE_SAVE'), 500);
			}

			$this->cleanCache('_system');
			$this->cleanCache('_system', 1);

			return ['status' => 'ok'];
		}

		throw new RuntimeException(Text::_('PLG_INSTALLER_ERROR_KEY'), 401);
	}


	protected function installedList()
	{
		$query = $this->db->getQuery(true);
		$query
			->select('*')
			->from($this->db->quoteName('#__radicalinstaller_extensions'));
		$list_installed = $this->db->setQuery($query)->loadObjectList();

		return $list_installed;
	}


	protected function toggleEnabled()
	{
		$id    = $this->app->input->getInt('id');
		$query = $this->db->getQuery(true);
		$query
			->select(['type'])
			->from($this->db->quoteName('#__radicalinstaller_extensions'))
			->where('id = ' . $this->db->quote($id));
		$item   = $this->db->setQuery($query);
		$result = false;
		$class  = '\\Radicalinstaller\\Provider' . ucfirst(strtolower($item->type));

		if (class_exists($class))
		{
			$result = (new $class())->enabled($id);
		}

		return json_encode(['status' => $result ? 'ok' : 'fail']);
	}


	protected function cleanCache($group = null, $client_id = 0)
	{
		$conf = Factory::getConfig();

		$options = [
			'defaultgroup' => !is_null($group) ? $group : Factory::getApplication()->input->get('option'),
			'cachebase'    => $client_id ? JPATH_ADMINISTRATOR . '/cache' : $conf->get('cache_path', JPATH_SITE . '/cache')
		];

		$cache = Cache::getInstance('callback', $options);
		$cache->clean();
	}


}