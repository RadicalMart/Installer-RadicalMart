<?php defined('_JEXEC') or die;

use Joomla\CMS\Cache\Cache;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Version;
use Radicalinstaller\API;
use Radicalinstaller\ProviderJoomla;

JLoader::register('RadicalinstallerHelper', __DIR__ . '/helper.php');

if ((new Version())->isCompatible('4.0'))
{
	JLoader::registerNamespace('Radicalinstaller', __DIR__ . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'Radicalinstaller', false, 'psr4');
}
else
{
	JLoader::registerNamespace('Radicalinstaller', __DIR__ . DIRECTORY_SEPARATOR . 'src', false, 'psr4');
}


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

			if ($method === 'groupsStartPage')
			{
				$output = $this->APIGroupsStartPage();
			}

			if ($method === 'projectList')
			{
				$output = $this->APIProjectList();
			}

			if ($method === 'projectsMy')
			{
				$output = $this->APIProjectsMy();
			}

			if ($method === 'projectsKey')
			{
				$output = $this->APIProjectsKey();
			}

			if ($method === 'projectsFree')
			{
				$output = $this->APIProjectsFree();
			}

			if ($method === 'project')
			{
				$output = $this->APIProject();
			}

			if ($method === 'getForInstallDepends')
			{
				$output = $this->APIGetForInstallDepends();
			}

			if ($method === 'install')
			{
				$output = $this->install();
			}

			if ($method === 'delete')
			{
				$output = $this->delete();
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

			if ($method === 'syncExtensions')
			{
				$output = $this->syncExtensions();
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
			$app->sendHeaders();
		} finally
		{
			$app->setHeader('Content-Type', 'application/json');
			$app->sendHeaders();

			//var_dump($output);die();

			return $output;
		}

	}


	protected function install()
	{

		$app            = Factory::getApplication();
		$input          = $app->input;
		$id             = $input->get('id', '', 'int');
		$project        = json_decode(API::project($id), JSON_OBJECT_AS_ARRAY);
		$provider_class = '\\Radicalinstaller\\Provider\\Provider' . ucfirst(strtolower(!empty($project['provider']) ? $project['provider'] : 'joomla'));
		$config         = [
			'api_key' => $this->params->get('apikey', '')
		];
		$install        = false;

		if (!class_exists($provider_class))
		{
			return json_encode([
				'status'   => 'fail',
				'messages' => [
					'Не найден провайдер для установки'
				]
			]);
		}

		$provider = new $provider_class($config);
		$messages = [];

		try
		{
			$install  = $provider->start($id);
			$messages = $provider->getMessages();
			if (!$install)
			{
				$messages[] = ['message' => 'Не удалось установить расширение', 'type' => 'danger'];
			}
		}
		catch (Exception $e)
		{
			$messages[] = ['message' => 'Не удалось установить расширение', 'type' => 'danger'];
		}

		return json_encode(['status' => $install ? 'ok' : 'fail', 'messages' => $messages]);
	}


	protected function delete()
	{
		$app     = Factory::getApplication();
		$input   = $app->input;
		$id      = $input->get('id', '', 'int');
		$project = json_decode(API::project($id), JSON_OBJECT_AS_ARRAY);;
		$provider_class = '\\Radicalinstaller\\Provider\\Provider' . ucfirst(strtolower(!empty($project['provider']) ? $project['provider'] : 'joomla'));

		if (!class_exists($provider_class))
		{
			return json_encode([
				'status'   => 'fail',
				'messages' => [
					'Не найден провайдер для удаления'
				]
			]);
		}

		$provider = new $provider_class();
		$result   = $provider->delete($id);
		$messages = $provider->getMessages();

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
		$projects_from_server = json_decode($projects_from_server, true);
		$projects             = [];
		$projects_for_update  = [];

		if (is_array($projects_from_server))
		{
			foreach ($projects_from_server as $project_from_server)
			{
				if(!isset($project_from_server['id']))
				{
					continue;
				}

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


	protected function APIMinimal()
	{
		return API::minimal();
	}


	protected function APICategories()
	{
		return API::categories();
	}


	protected function APIGroupsStartPage()
	{
		return API::groupsStartPage($this->params->get('apikey', ''));
	}


	protected function APIProjects()
	{
		$id = $this->app->input->get('category_id');

		if ($id === 'my')
		{
			$key = $this->params->get('apikey', '');

			if (empty($key))
			{
				return [];
			}

			$projects = API::projectsMy($key);

			return $projects;
		}

		$page  = $this->app->input->get('page', 1, 'int');
		$limit = $this->app->input->get('limit', 12, 'int');

		return API::projects($id, $page, $limit);
	}


	protected function APIProjectList()
	{
		$ids = $this->app->input->get('ids', '{}', 'raw');

		return API::projectList($ids);
	}


	protected function APIGetForInstallDepends()
	{
		$id       = $this->app->input->getInt('project_id');
		$projects = API::getForInstallDepends($id);

		return $projects;
	}


	protected function APIProject()
	{
		$id = $this->app->input->get('project_id');

		return API::project($id);
	}


	protected function APIProjectsKey()
	{
		$key = $this->params->get('apikey', '');

		return API::projectsKey($key);
	}


	protected function APIProjectsFree()
	{
		return API::projectsFree();
	}


	protected function syncExtensions()
	{
		$result = RadicalinstallerHelper::syncExtensions();

		if ($result === false)
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_SYNC'), 500);
		}

		return $result;
	}


	protected function checkInstall()
	{
		$list             = $this->app->input->getString('list', '{}');
		$list             = json_decode($list, JSON_OBJECT_AS_ARRAY);
		$fields           = [];
		$find_list_output = [];

		if (!is_array($list))
		{
			$list = [];
		}

		if (count($list) === 0)
		{
			return [];
		}

		foreach ($list as $value)
		{
			$fields[] = $this->db->quote((int) $value);
		}

		$query = $this->db->getQuery(true);
		$query
			->select(['project_id'])
			->from($this->db->quoteName('#__radicalinstaller_extensions'))
			->where('project_id IN (' . implode(',', $fields) . ')');
		$find_list = $this->db->setQuery($query)->loadObjectList();

		foreach ($find_list as $find)
		{
			$find_list_output[] = $find->project_id;
		}

		return $find_list_output;
	}


	protected function saveKey()
	{
		$key = trim($this->app->input->getString('key'));

		if (empty($key))
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_KEY'), 401);
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
				throw new RuntimeException(Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_DATABASE_SAVE'), 500);
			}

			$this->cleanCache('_system');
			$this->cleanCache('_system', 1);

			return ['status' => 'ok'];
		}

		throw new RuntimeException(Text::_('PLG_INSTALLER_RADICALINSTALLER_ERROR_KEY'), 401);
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