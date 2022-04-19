<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Table\Table;
use Radicalinstaller\API;

class RadicalinstallerHelper
{


	public static function syncExtensions()
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
			$extensions_for_api[$item->element] = [
				'folder' => $item->folder,
				'type'   => $item->type
			];
		}

		// отсылаем на сервер radicalmart.ru и получаем ответ об установленных расширениях
		$sync_projects = json_decode(API::syncExtensions(json_encode($extensions_for_api)), JSON_OBJECT_AS_ARRAY);

		if (!is_array($sync_projects))
		{
			return false;
		}

		foreach ($list as $item)
		{
			$params                     = json_decode($item->manifest_cache, JSON_OBJECT_AS_ARRAY);
			$extensions[$item->element] = [
				'id'      => $item->extension_id,
				'version' => $params['version'] ?? '',
			];
		}

		unset($extensions_for_api);
		unset($params);

		Table::addIncludePath(JPATH_ROOT . '/plugins/installer/radicalinstaller/tables');

		$count = count($sync_projects);

		foreach ($sync_projects as $sync_project)
		{
			$element = $sync_project['joomla']['element'];
			$table   = Table::getInstance('RadicalinstallerExtensions', 'Table');
			$table->load(['element' => $sync_project['element']]);
			$table->type         = $sync_project['install'];
			$table->title        = $sync_project['title'];
			$table->element      = $sync_project['element'];
			$table->version      = $extensions[$element]['version'] ?? '';
			$table->project_id   = $sync_project['id'];
			$table->extension_id = $extensions[$element]['id'] ?? '';

			if (!$table->check())
			{
			}

			if (!$table->store())
			{
			}

		}

		return $count;
	}


}