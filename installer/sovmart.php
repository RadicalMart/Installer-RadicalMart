<?php defined('_JEXEC') or die;

use Joomla\CMS\Cache\Cache;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\FileLayout;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Version;
use Sovmart\API;
use Sovmart\Config;
use Sovmart\Provider\FactoryProvider;

JLoader::register('SovmartHelper', __DIR__ . '/helper.php');

if ((new Version())->isCompatible('4.0'))
{
	JLoader::registerNamespace('Sovmart', __DIR__ . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'Sovmart', false, 'psr4');
}
else
{
	JLoader::registerNamespace('Sovmart', __DIR__ . DIRECTORY_SEPARATOR . 'src', false, 'psr4');
}


/**
 * PlgInstallerSovmart Plugin.
 *
 */
class PlgInstallerSovmart extends CMSPlugin
{

	protected $app;

	protected $db;

	protected $autoloadLanguage = true;

	public function onInstallerAddInstallationTab()
	{

		$tab          = [];
		$tab['name']  = 'sovmart';
		$tab['label'] = Text::_('PLG_INSTALLER_SOVMART_TEXT');

		$content        = new FileLayout('default', JPATH_ROOT . '/plugins/installer/sovmart/tmpl');
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
		$query->delete($this->db->quoteName('#__sovmart_extensions'));
		$query->where($conditions);
		$this->db->setQuery($query);
		$this->db->execute();
	}

	public function onInstallerBeforePackageDownload(&$url, &$headers)
	{
		if (
			parse_url($url, PHP_URL_HOST) === Config::$host &&
			$token = $this->params->get('token')
		)
		{

			$headers['Authorization'] = 'Bearer ' . $token;
		}

		return true;
	}

	public function onAjaxSovmart()
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

			$method_name = 'method' . ucfirst(strtolower($method));

			if (!method_exists($this, $method_name))
			{
				throw new Exception('Not found method', 404);
			}

			@error_reporting(0);

			$token = $this->params->get('token', '');

			if (!empty($token))
			{
				Api::setToken($token);
			}

			$output = $this->$method_name();
		}
		catch (Throwable $e)
		{
			$output = $e->getMessage();
			$app->setHeader('status', $e->getCode(), true);
			$app->sendHeaders();
		} finally
		{
			$app->setHeader('Content-Type', 'application/json');
			$app->sendHeaders();

			echo $output;

			$this->app->close();
		}

	}

	protected function methodInstall()
	{

		$app            = Factory::getApplication();
		$input          = $app->input;
		$id             = $input->get('id', '', 'int');
		$project        = json_decode(API::project($id), true);
		$error_provider = json_encode([
			'status'   => 'fail',
			'messages' => [
				[
					'message' => Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_PROVIDER_NO_FOUND'),
					'type'    => 'danger'
				]
			]
		]);

		if (empty($project['data']['attributes']['provider']))
		{
			return $error_provider;
		}

		$provider_class = '\\Sovmart\\Provider\\Collections\\Provider' . ucfirst(strtolower($project['data']['attributes']['provider']));

		if (!class_exists($provider_class))
		{
			return $error_provider;
		}

		$config   = [];
		$install  = false;
		$messages = [];
		$provider = new $provider_class($config);

		try
		{
			$install  = $provider->start($id);
			$messages = $provider->getMessages();
		}
		catch (Exception $e)
		{
			$messages[] = ['message' => Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'), 'type' => 'danger'];
		}

		return json_encode(['status' => $install ? 'ok' : 'fail', 'messages' => $messages]);
	}

	protected function methodDelete()
	{
		$app     = Factory::getApplication();
		$input   = $app->input;
		$id      = $input->get('id', '', 'int');
		$project = json_decode(API::project($id), true);;
		$provider_class = '\\Sovmart\\Provider\\Collections\\Provider' . ucfirst(strtolower(!empty($project['provider']) ? $project['provider'] : 'joomla'));

		if (!class_exists($provider_class))
		{
			return json_encode([
				'status'   => 'fail',
				'messages' => [
					[
						'message' => Text::_('PLG_INSTALLER_SOVMART_TEXT_DELETE_PROVIDER_NO_FOUND'),
						'type'    => 'danger'
					]
				]
			]);
		}

		$provider = new $provider_class();
		$result   = $provider->delete($id);
		$messages = $provider->getMessages();

		return json_encode(['status' => $result ? 'ok' : 'fail', 'messages' => $messages]);
	}

	protected function methodCheckupdates()
	{
		$ids   = [];
		$query = $this->db->getQuery(true);
		$query
			->select(['id', 'title', 'version', 'cover', 'project_id'])
			->from($this->db->quoteName('#__sovmart_extensions'));
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
				if (!isset($project_from_server['id']))
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

	protected function methodMinimal()
	{
		$response        = json_decode(API::minimal(), true);
		$current_version = SovmartHelper::getVersion();
		$result          = true;

		if (
			isset($response['data']['attributes']['version']) &&
			!empty($current_version) &&
			version_compare($current_version, $response['data']['attributes']['version'], '<')
		)
		{
			$result = false;
		}

		return json_encode(['result' => $result]);
	}

	protected function methodCategories()
	{
		return API::categories();
	}

	protected function methodStartpage()
	{
		return API::groupsStartPage();
	}

	protected function methodProjects()
	{
		$id = $this->app->input->get('category_id');

		$page  = $this->app->input->get('page', 1, 'int');
		$limit = $this->app->input->get('limit', 12, 'int');

		return API::projects($id, $page, $limit);
	}

	protected function methodProjectlist()
	{
		$ids = $this->app->input->get('ids', '{}', 'raw');

		return API::projectList($ids);
	}

	protected function methodProject()
	{
		$id = $this->app->input->get('project_id');

		return API::project($id);
	}

	protected function methodProjectspaid()
	{
		return API::projectsPaid();
	}

	protected function methodProjectsfree()
	{
		return API::projectsFree();
	}

	protected function methodSync()
	{

		$result    = 0;
		$providers = FactoryProvider::getInstance();

		foreach ($providers as $provider)
		{
			$result += $provider->sync();
		}

		SovmartHelper::updateParams(
			['sync' => 0]
		);

		return $result;
	}

	protected function methodCheckinstall()
	{
		$list             = $this->app->input->getString('list', '{}');
		$list             = json_decode($list, true);
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
			->from($this->db->quoteName('#__sovmart_extensions'))
			->where('project_id IN (' . implode(',', $fields) . ')');
		$find_list = $this->db->setQuery($query)->loadObjectList();

		foreach ($find_list as $find)
		{
			$find_list_output[] = $find->project_id;
		}

		return $find_list_output;
	}

	protected function methodSavetoken()
	{
		$token = trim($this->app->input->getString('token'));

		// сохраняем пустой токен
		if (empty($token))
		{

			$this->params->set('token', '');
			$this->params->set('name', '');

			$query  = $this->db->getQuery(true);
			$fields = [
				$this->db->qn('params') . ' = ' . $this->db->q($this->params->toString())
			];

			$conditions = [
				$this->db->qn('element') . ' = ' . $this->db->q('sovmart'),
				$this->db->qn('folder') . ' = ' . $this->db->q('installer'),
			];

			$query->update($this->db->quoteName('#__extensions'))->set($fields)->where($conditions);
			$this->db->setQuery($query);
			$result = $this->db->execute();

			if (!$result)
			{
				throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_ERROR_DATABASE_SAVE'), 500);
			}

			return ['status' => 'ok'];
		}

		API::setToken($token);
		$result = json_decode(API::checkToken(), true);

		if (
			!isset($result['data']['attributes']['find']) ||
			!$result['data']['attributes']['find']
		)
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_ERROR_NOT_FOUND_AUTH'), 401);
		}

		$this->params->set('token', $token);
		$this->params->set('name', $result['data']['attributes']['name']);

		$query  = $this->db->getQuery(true);
		$fields = [
			$this->db->qn('params') . ' = ' . $this->db->q($this->params->toString())
		];

		$conditions = [
			$this->db->qn('element') . ' = ' . $this->db->q('sovmart'),
			$this->db->qn('folder') . ' = ' . $this->db->q('installer'),
		];

		$query->update($this->db->quoteName('#__extensions'))->set($fields)->where($conditions);
		$this->db->setQuery($query);
		$result = $this->db->execute();

		if (!$result)
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_ERROR_DATABASE_SAVE'), 500);
		}

		// очистка кеша, так как джумла кеширует параметры плагинов и компонентов, чтобы обновился токен надо кеш сбросить
		$this->cleanCache('_system');
		$this->cleanCache('_system', 1);

		return ['status' => 'ok'];

	}

	protected function methodInstalledlist()
	{
		$query = $this->db->getQuery(true);
		$query
			->select('*')
			->from($this->db->quoteName('#__sovmart_extensions'));
		$list_installed = $this->db->setQuery($query)->loadObjectList();

		return $list_installed;
	}

	protected function methodSearch()
	{
		return API::search($this->app->input->getString('q', ''));
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