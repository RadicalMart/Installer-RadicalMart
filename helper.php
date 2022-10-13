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


}