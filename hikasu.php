<?php defined('_JEXEC') or die;

use Hikasu\API;
use Hikasu\ProviderJoomla;
use Hikasu\ProviderYooelements;
use Hikasu\ProviderYoolayouts;
use Joomla\CMS\Cache\Cache;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\Plugin\CMSPlugin;

/**
 * PlgInstallerHikasu Plugin.
 *
 * @since  3.6.0
 */
class PlgInstallerHikasu extends CMSPlugin
{

	/**
	 * @var
	 * @since version
	 */
	protected $app;


	protected $db;


	/**
	 * Load the language file on instantiation.
	 *
	 * @var    boolean
	 * @since  3.6.0
	 */
	protected $autoloadLanguage = true;


	/**
	 * Textfield or Form of the Plugin.
	 *
	 * @return  array  Returns an array with the tab information
	 *
	 * @since   3.6.0
	 */
	public function onInstallerAddInstallationTab()
	{
		$tab          = array();
		$tab['name']  = 'hikasu';
		$tab['label'] = Text::_('PLG_INSTALLER_HIKASU_TEXT');

		$content        = new FileLayout('default', JPATH_ROOT . '/plugins/installer/hikasu/tmpl');
		$tab['content'] = $content->render(['params' => $this->params]);

		return $tab;
	}


	/**
	 *
	 * @return array|bool|false|string
	 *
	 * @throws Exception
	 * @since version
	 */
	public function onAjaxHikasu()
	{
		JLoader::registerNamespace('Hikasu', __DIR__ . DIRECTORY_SEPARATOR . 'src');
		$app    = Factory::getApplication();
		$method = $app->input->get('method');

		if (!$app->isClient('administrator'))
		{
			return false;
		}

		if ($method === 'categories')
		{
			return $this->APICategories();
		}

		if ($method === 'projects')
		{
			return $this->APIProjects();
		}

		if ($method === 'projectList')
		{
			return $this->APIProjectList();
		}

		if ($method === 'checkMainExtension')
		{
			return $this->checkMainExtension();
		}

		if ($method === 'project')
		{
			return $this->APIProject();
		}

		if ($method === 'getForInstallDepends')
		{
			return $this->APIGetForInstallDepends();
		}

		if ($method === 'installJoomla')
		{
			return $this->installJoomla();
		}

		if ($method === 'checkInstall')
		{
			return $this->checkInstall();
		}

		if ($method === 'checkUpdates')
		{
			return $this->checkUpdates();
		}

		if ($method === 'installedList')
		{
			return $this->installedList();
		}

		if ($method === 'toggleEnabled')
		{
			return $this->toggleEnabled();
		}
		if ($method === 'saveKey')
		{
			return $this->saveKey();
		}

	}


	/**
	 *
	 * @return false|string
	 *
	 * @throws Exception
	 * @since version
	 */
	protected function installJoomla()
	{
		$app      = Factory::getApplication();
		$input    = $app->input;
		$id       = $input->get('id', '', 'int');
		$config   = [
			'api_key' => $this->params->get('apikey')
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

	/**
	 *
	 * @return false|string
	 *
	 * @since version
	 */
	protected function checkUpdates()
	{
		$ids = [];

		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query
			->select(['id', 'title', 'version', 'project_id'])
			->from($db->quoteName('#__hikasu_install'));
		$projects_install = $db->setQuery($query)->loadObjectList();

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

	/**
	 *
	 * @return array|string
	 *
	 * @since version
	 */
	protected function APIProjects()
	{
		$id       = $this->app->input->get('category_id');
		$page     = $this->app->input->get('page', 1, 'int');
		$limit    = $this->app->input->get('limit', 12, 'int');
		$projects = API::projects($id, $page, $limit);

		return $projects;
	}


	/**
	 *
	 * @return array|string
	 *
	 * @since version
	 */
	protected function APIProjectList()
	{
		$ids      = $this->app->input->get('ids', '{}', 'raw');
		$projects = API::projectList($ids);

		return $projects;
	}


	/**
	 *
	 * @return array|string
	 *
	 * @since version
	 */
	protected function APIGetForInstallDepends()
	{
		$id       = $this->app->input->getInt('project_id');
		$projects = API::getForInstallDepends($id);

		return $projects;
	}


	/**
	 *
	 * @return array|string
	 *
	 * @since version
	 */
	protected function APIProject()
	{
		$id      = $this->app->input->get('project_id');
		$project = API::project($id);

		return $project;
	}


	/**
	 *
	 * @return array
	 *
	 * @throws Exception
	 * @since version
	 */
	protected function checkInstall()
	{
		$list             = $this->app->input->getString('list', '{}');
		$list             = json_decode($list, JSON_OBJECT_AS_ARRAY);
		$fields           = [];
		$find_list_output = [];
		$db               = Factory::getDbo();

		foreach ($list as $value)
		{
			$fields[] = $db->quote($value);
		}

		$query = $db->getQuery(true);
		$query
			->select(['element'])
			->from($db->quoteName('#__extensions'))
			->where('element IN (' . implode(',', $fields) . ')');
		$find_list = $db->setQuery($query)->loadObjectList();

		foreach ($find_list as $find)
		{
			$find_list_output[] = $find->element;
		}

		$query = $db->getQuery(true);
		$query
			->select(['element'])
			->from($db->quoteName('#__hikasu_install'))
			->where('element IN (' . implode(',', $fields) . ')');
		$find_list = $db->setQuery($query)->loadObjectList();

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
			throw new RuntimeException(Text::_('Ошибка подключения к radicalmart.ru'), 500);
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
			throw new RuntimeException(Text::_('Пустой ключ'), 401);
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
				$this->db->qn('element') . ' = ' . $this->db->q('hikasu'),
				$this->db->qn('folder') . ' = ' . $this->db->q('installer'),
			];

			$query->update($this->db->quoteName('#__extensions'))->set($fields)->where($conditions);
			$this->db->setQuery($query);
			$result = $this->db->execute();

			if (!$result)
			{
				throw new RuntimeException(Text::_('Ошибка при сохранение'), 500);
			}

			$this->cleanCache('_system', 0);
			$this->cleanCache('_system', 1);

			return "ok";
		}

		throw new RuntimeException(Text::_('Недопустимый ключ'), 401);
	}


	/**
	 *
	 * @return array|mixed
	 *
	 * @since version
	 */
	protected function installedList()
	{
		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query
			->select('*')
			->from($db->quoteName('#__hikasu_install'));
		$list_installed = $db->setQuery($query)->loadObjectList();

		return $list_installed;
	}


	protected function toggleEnabled()
	{
		$id = $this->app->input->getInt('id');

		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query
			->select(['type'])
			->from($db->quoteName('#__hikasu_install'))
			->where('id = ' . $db->quote($id));
		$item   = $db->setQuery($query);
		$result = false;
		$class  = '\\Hikasu\\Provider' . ucfirst(strtolower($item->type));

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