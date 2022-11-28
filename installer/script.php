<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Installer\InstallerAdapter;
use Joomla\Filesystem\Folder;
use Joomla\Registry\Registry;

class plgInstallerSovmartInstallerScript
{


	/**
	 * Runs right after any installation action.
	 *
	 * @param   string            $type    Type of PostFlight action. Possible values are:
	 * @param   InstallerAdapter  $parent  Parent object calling object.
	 *
	 * @since  1.1.0
	 */
	function postflight($type, $parent)
	{
		if ($type === 'install')
		{

			$db              = Factory::getDbo();
			$elements_key    = [$db->q('com_radicalmart'), $db->q('com_radicalmart_express')];
			$find_key        = '';
			$plugin          = new stdClass();
			$plugin->type    = 'plugin';
			$plugin->element = 'sovmart';
			$plugin->folder  = 'installer';
			$plugin->enabled = 1;

			$query = $db->getQuery(true);
			$query
				->select($db->quoteName('params'))
				->from($db->quoteName('#__extensions'))
				->where($db->qn('element') . ' IN (' . implode(',', $elements_key) . ')');
			$find_list = $db->setQuery($query)->loadObjectList();

			foreach ($find_list as $item)
			{
				$item        = (object) $item;
				$params_item = new Registry($item->params);
				$find_key    = $params_item->get('product_key', $find_key);
			}

			if (!empty($find_key))
			{
				$params = new Registry();
				$params->set('apikey', $find_key);
				$plugin->params = $params->toString();
			}

			// Update record
			$db->updateObject('#__extensions', $plugin, ['type', 'element', 'folder']);

		}

		$this->triggerScriptTrigger($type);
		$this->deleteScriptTrigger();
	}


	protected function deleteScriptTrigger()
	{
		try
		{
			$path    = __DIR__ . '/scripttrigger';

			if (!file_exists($path))
			{
				return;
			}

			$folders = Folder::folders($path);

			foreach ($folders as $folder)
			{
				Folder::delete($path . '/' . $folder);
			}
		}
		catch (Throwable $e)
		{

		}
	}


	protected function triggerScriptTrigger($name)
	{
		$path = __DIR__ . '/scripttrigger/' . $name;

		if (!file_exists($path))
		{
			return;
		}

		$files = Folder::files($path);

		foreach ($files as $file)
		{
			try
			{
				include_once $path . '/' . $file;
			}
			catch (Throwable $e)
			{

			}
		}

	}

}