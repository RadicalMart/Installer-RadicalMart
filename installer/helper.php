<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\Registry\Registry;

class SovmartHelper
{

	public static function getVersion()
	{
		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query->select(['extension_id', 'folder', 'manifest_cache', 'enabled']);
		$query->from('#__extensions');
		$query->where($db->quoteName('type') . '=' . $db->q('plugin'));
		$query->where($db->quoteName('folder') . '=' . $db->q('installer'));
		$query->where($db->quoteName('element') . '=' . $db->q('sovmart'));
		$extension_joomla = $db->setQuery($query)->loadObject();
		$manifest_cache   = new Registry($extension_joomla->manifest_cache);
		$version          = $manifest_cache->get('version');

		return $version;
	}

	public static function getParams()
	{
		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query->select(['params']);
		$query->from('#__extensions');
		$query->where($db->quoteName('type') . '=' . $db->q('plugin'));
		$query->where($db->quoteName('folder') . '=' . $db->q('installer'));
		$query->where($db->quoteName('element') . '=' . $db->q('sovmart'));
		$extension_joomla = $db->setQuery($query)->loadObject();

		return new Joomla\Registry\Registry($extension_joomla->params);
	}

	public static function updateParams($data = [])
	{
		$params = static::getParams();

		foreach ($data as $key => $value)
		{
			$params->set($key, $value);
		}

		$db              = Factory::getDbo();
		$plugin          = new stdClass();
		$plugin->type    = 'plugin';
		$plugin->element = 'sovmart';
		$plugin->folder  = 'installer';
		$plugin->params  = $params->toString();

		return $db->updateObject('#__extensions', $plugin, ['type', 'element', 'folder']);
	}

}