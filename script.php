<?php defined('_JEXEC') or die;

use Joomla\CMS\Installer\InstallerAdapter;
use Joomla\Filesystem\Folder;

class pkgsovmartInstallerScript
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
		$this->triggerScriptTrigger($type);
	}


	protected function triggerScriptTrigger($name)
	{
		//$path = JPATH_ROOT . '/plugins/installer/sovmart/scripttrigger/' . $name;
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