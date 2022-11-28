<?php namespace Sovmart\Provider\Collections;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Model\BaseDatabaseModel;
use Joomla\CMS\Table\Table;
use Joomla\Registry\Registry;
use Sovmart\API;

defined('_JEXEC') or die;

class ProviderJoomlamirror extends ProviderJoomla
{

	protected $name = 'joomlamirror';

	public function start($id)
	{
		$app     = Factory::getApplication();
		$input   = $app->input;
		$project = json_decode(API::project($id), true);
		$url     = $this->scheme . '://' . $this->host . $project['download'];

		$input->set('installtype', 'url');
		$input->set('install_url', $url);

		Factory::getApplication()->getLanguage()->load('com_installer');
		BaseDatabaseModel::addIncludePath(JPATH_ROOT . '/administrator/components/com_installer/models');
		$model = BaseDatabaseModel::getInstance('Install', 'InstallerModel');

		try
		{

			$result = $model->install();

			if ($result)
			{
				//проверяем что поставила джумла на расширение
				$type    = 'file';
				$element = $project['element'] ?? '';
				$folder  = '';

				$db    = Factory::getDbo();
				$query = $db->getQuery(true);
				$query->select(['extension_id', 'folder', 'manifest_cache', 'enabled']);
				$query->from('#__extensions');
				$query->where($db->quoteName('type') . '=' . $db->quote($type));
				$query->where($db->quoteName('element') . '=' . $db->quote($element));
				$extension_joomla = $db->setQuery($query)->loadObject();

				if(empty($extension_joomla->manifest_cache))
				{
					throw new RuntimeException('Not found installed extension');
				}

				$manifest_cache   = new Registry($extension_joomla->manifest_cache);
				$version          = $manifest_cache->get('version');

				if (isset($project['version']['version']))
				{
					$version = $project['version']['version'];
				}

				$table = Table::getInstance('SovmartExtensions', 'Table');
				$table->load([
					'provider' => $project['provider'],
					'type'     => $type,
					'element'  => $element,
					'folder'   => $folder
				]);

				$table->provider       = $project['provider'];
				$table->title          = $project['title'];
				$table->cover          = $sync_project['images']['cover'] ?? '';
				$table->type           = $type;
				$table->element        = $element;
				$table->folder         = $folder;
				$table->version        = $version;
				$table->branch         = 'stable';
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

				// TODO лог

				//$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_TEXT_PROVIDER_JOOMLA_INSTALLED'));
			}
			else
			{
				// TODO лог

				//$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'), 'error');
			}
		}
		catch (Throwable $e)
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'), 'error');

			$this->addMessage(
				Text::sprintf('PLG_INSTALLER_SOVMART_ERROR_THROWABLE',
					(string) $e->getLine(),
					(string) $e->getFile(),
					(string) $e->getMessage()
				),
				'error'
			);
			$result = false;
		}

		return $result;
	}


	public function sync()
	{
		$count      = 0;
		$extensions = [];

		// достаем список всех установленных расширений
		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query
			->select($db->qn(['extension_id', 'type', 'element', 'folder', 'manifest_cache']))
			->from($db->quoteName('#__extensions'));
		$list               = $db->setQuery($query)->loadObjectList();
		$extensions_for_api = [];

		foreach ($list as $item)
		{
			$extensions_for_api[] = implode('.', [$item->type, $item->folder, $item->element]);
		}

		// отсылаем на сервер radicalmart.ru и получаем ответ об установленных расширениях
		$sync_projects = json_decode(API::syncExtensions($this->name, json_encode($extensions_for_api)), true);

		if (!is_array($sync_projects))
		{
			return 0;
		}

		foreach ($list as $item)
		{
			$params                     = json_decode($item->manifest_cache, JSON_OBJECT_AS_ARRAY);
			$extensions[$item->element] = [
				'id'      => $item->extension_id,
				'version' => $params['version'] ?? '',
				'folder'  => $item->folder,
			];
		}

		unset($extensions_for_api);
		unset($params);

		Table::addIncludePath(JPATH_ROOT . '/plugins/installer/sovmart/tables');

		$count = count($sync_projects);

		foreach ($sync_projects as $sync_project)
		{

			$type    = 'file';
			$element = $sync_project['element'];
			$folder  = '';
			$table   = Table::getInstance('SovmartExtensions', 'Table');

			$table->load([
				'provider' => $sync_project['provider'],
				'type'     => $type,
				'folder'   => $folder,
				'element'  => $element
			]);

			$table->title          = $sync_project['title'];
			$table->provider       = $sync_project['provider'];
			$table->cover          = $sync_project['images']['cover'] ?? '';
			$table->type           = $type;
			$table->branch         = 'stable';
			$table->element        = $element;
			$table->folder         = $folder ?? '';
			$table->version        = $extensions[$element]['version'] ?? '';
			$table->project_id     = $sync_project['id'];
			$table->extension_id   = $extensions[$element]['id'] ?? '';
			$table->category_title = $sync_project['title'];

			if (!$table->check())
			{
				// TODO отдать ошибку
				$count--;
				continue;
			}

			if (!$table->store())
			{
				// TODO отдать ошибку
				$count--;
				continue;
			}

		}

		return $count;
	}
}