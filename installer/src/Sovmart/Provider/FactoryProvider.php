<?php namespace Sovmart\Provider;

defined('_JEXEC') or die;

use http\Exception\InvalidArgumentException;
use Joomla\Filesystem\Folder;

class FactoryProvider
{

	public static function getInstance($name = null, $options = [])
	{
		$namespace = '\\Sovmart\\Provider\\Collections\\';

		if($name === null)
		{
			$output = [];
			$files = Folder::files(__DIR__ . '/Collections');

			foreach ($files as $file)
			{
				$class_name = $namespace . '\\' . str_replace('.php', '', $file);
				$output[] = new $class_name($options);
			}

			return $output;
		}

		$class_name = $namespace . '\\Provider' . ucfirst($name);

		if(!class_exists($class_name))
		{
			throw new InvalidArgumentException('No found provider');
		}

		return new $class_name($options);
	}

}
