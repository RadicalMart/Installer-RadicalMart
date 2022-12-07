<?php namespace Sovmart\Provider\Collections;

defined('_JEXEC') or die;

use Joomla\Archive\Zip;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Table\Table;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use RuntimeException;
use Sovmart\API;
use Sovmart\Config;
use Sovmart\Provider\ProviderInterface;

class ProviderYoolayouts implements ProviderInterface
{

	protected $name = 'yoolayouts';

	/**
	 * Путь для распаковки zip архива
	 *
	 * @var string
	 */
	private $filepath_extract;


	protected $config = [];


	protected $messages = [];


	public function __construct($config = [])
	{
		Table::addIncludePath(JPATH_ROOT . '/plugins/installer/sovmart/tables');
		$this->scheme = Config::$scheme;
		$this->host   = Config::$host;
		$this->config = $config;
	}


	public function start($id)
	{
		$db = Factory::getDbo();

		// проверка что стоит ютим про вообще
		$query    = $db->getQuery(true)
			->select(['e.extension_id', 'e.custom_data'])
			->from($db->quoteName('#__extensions', 'e'))
			->where($db->quoteName('e.type') . ' = ' . $db->quote('plugin'))
			->where($db->quoteName('e.element') . ' = ' . $db->quote('yootheme'))
			->where($db->quoteName('e.folder') . ' = ' . $db->quote('system'));
		$yootheme = $db->setQuery($query)->loadObject();

		if (!$yootheme)
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_YOOTHEME_PRO'), 'error');

			return false;
		}

		$project = json_decode(API::project($id), true);

		if (!isset($project['data']['attributes']['id']))
		{
			throw new RuntimeException('Not found project');
		}

		$zip = new Zip;

		if (!Zip::hasNativeSupport())
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_ZIP'), 'error');

			return false;
		}

		// проверка
		$this->filepath         = JPATH_ROOT . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . md5(date('U'));
		$this->filepath_extract = JPATH_ROOT . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . md5('extract_' . date('U'));

		$request = API::request(API::getProjectDownload($project['data']['attributes']['id']));

		//если сервер прислал ошибку, то пишем и выходим
		if ($request->code !== 200)
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_ARCHIVE_SERVICE'), 'error');

			return false;
		}

		$body = (!empty($request->body)) ? $request->body : false;
		$body = json_decode($body, true);

		//если ключ установлен, но не находится такой на сервере
		if (is_array($body) && isset($body['attributes']['messages']))
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR_KEY'), 'error');

			return false;
		}

		//пишем ответ в файл
		if (File::write($this->filepath, $request->body))
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'));
		}

		//проверяем архив ли
		if (!$zip->checkZipData($request->body))
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'));
		}

		//вытаскиваем данные из архива
		if (!$zip->extract($this->filepath, $this->filepath_extract))
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'));
		}

		$files = Folder::files($this->filepath_extract);

		// Get current
		$items = [];

		if ($custom_data = $yootheme->custom_data)
		{
			$custom_data = json_decode($custom_data, true);

			if (!empty($custom_data['library']))
			{
				foreach ($custom_data['library'] as $key => $item)
				{
					$items[$key] = $item;
				}
			}
		}

		// Add new items
		foreach ($files as $file)
		{
			$item = json_decode(file_get_contents($this->filepath_extract . DIRECTORY_SEPARATOR . $file), true);

			if (empty($item['name']))
			{
				throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'));
			}

			$filename_split = explode('.', $file);
			$ext            = array_pop($filename_split);

			// Check name
			$key          = 'sovmart_yoolayouts_' . $project['data']['attributes']['element'];
			$item['name'] = $project['data']['attributes']['title'] . '; ' . ((count($files) > 1) ? (implode($filename_split) . '; ') : '') . 'v' . $project['data']['attributes']['version']['version'];

			// Add to items
			$items[$key] = $item;
		}

		// Update plugin
		$yootheme->custom_data            = ($custom_data) ?: array();
		$yootheme->custom_data['library'] = $items;
		$yootheme->custom_data            = json_encode($yootheme->custom_data);

		if (!$db->updateObject('#__extensions', $yootheme, array('extension_id')))
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'));
		}

		//записываем обновление
		$table = Table::getInstance('SovmartExtensions', 'Table');
		$table->load([
			'provider' => strtolower($project['data']['attributes']['provider']),
			'element'  => $project['data']['attributes']['element'],
		]);

		$table->provider       = $project['data']['attributes']['provider'];
		$table->title          = $project['data']['attributes']['title'];
		$table->cover          = $project['data']['attributes']['images']['cover'] ?? '';
		$table->type           = 'layout';
		$table->element        = $project['data']['attributes']['element'];
		$table->folder         = '';
		$table->version        = $project['data']['attributes']['version']['version'];
		$table->branch         = 'stable';
		$table->project_id     = $project['data']['attributes']['id'];
		$table->category_title = $project['data']['attributes']['title'];
		$table->extension_id   = 0;

		if (!$table->check())
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'));
		}

		if (!$table->store())
		{
			throw new RuntimeException(Text::_('PLG_INSTALLER_SOVMART_TEXT_INSTALL_ERROR'));
		}

		$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_TEXT_PROVIDER_YOOTHEMEPRO_LAYOUTS_INSTALLED'));

		return true;

	}


	public function delete($id)
	{
		$db = Factory::getDbo();

		// проверка что стоит ютим про вообще
		$query    = $db->getQuery(true)
			->select(['e.extension_id', 'e.custom_data'])
			->from($db->quoteName('#__extensions', 'e'))
			->where($db->quoteName('e.type') . ' = ' . $db->quote('plugin'))
			->where($db->quoteName('e.element') . ' = ' . $db->quote('yootheme'))
			->where($db->quoteName('e.folder') . ' = ' . $db->quote('system'));
		$yootheme = $db->setQuery($query)->loadObject();

		if (!$yootheme)
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_YOOTHEME_PRO'), 'error');

			return false;
		}


		$query      = $db->getQuery(true);
		$conditions = [
			$db->quoteName('project_id') . ' = ' . (int) $id,
		];
		$query->delete($db->quoteName('#__sovmart_extensions'));
		$query->where($conditions);
		$db->setQuery($query);
		$project = $db->setQuery($query)->loadObject();

		if ($custom_data = $yootheme->custom_data)
		{
			$custom_data = json_decode($custom_data, true);
			$items       = [];

			if (is_array($custom_data) && !empty($custom_data['library']))
			{

				foreach ($custom_data['library'] as $key => $item)
				{
					if (strpos($key, 'sovmart_yoolayouts_' . $project['data']['attributes']['element']) !== false)
					{
						continue;
					}

					$items[$key] = $item;
				}
			}

			$yootheme->custom_data            = ($custom_data) ?: [];
			$yootheme->custom_data['library'] = $items;
			$yootheme->custom_data            = json_encode($yootheme->custom_data);

			if (!$db->updateObject('#__extensions', $yootheme, array('extension_id')))
			{
				return false;
			}
		}


		$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_TEXT_PROVIDER_YOOTHEMEPRO_LAYOUTS_DELETED'));

		return $db->execute();
	}


	public function addMessage($msg, $type = 'info')
	{
		$this->messages[] = ['message' => $msg, 'type' => $type];
	}


	public function getMessages()
	{
		return $this->messages;
	}


	public function sync()
	{
		$db = Factory::getDbo();

		// проверка что стоит ютим про вообще
		$query    = $db->getQuery(true)
			->select(['e.extension_id', 'e.custom_data'])
			->from($db->quoteName('#__extensions', 'e'))
			->where($db->quoteName('e.type') . ' = ' . $db->quote('plugin'))
			->where($db->quoteName('e.element') . ' = ' . $db->quote('yootheme'))
			->where($db->quoteName('e.folder') . ' = ' . $db->quote('system'));
		$yootheme = $db->setQuery($query)->loadObject();

		if (!$yootheme)
		{
			return 0;
		}

		// смотрим на локальные
		$custom_data = json_decode($yootheme->custom_data, true);

		if (empty($custom_data['library']))
		{
			return 0;
		}

		$items = [];

		// собираем коллекцию с версиями и названием element
		foreach ($custom_data['library'] as $key => $item)
		{
			if (strpos('sovmart_yoolayouts_', $item['name']) === false)
			{
				continue;
			}

			$items[] = [
				'element' => str_replace('sovmart_yoolayouts_', '', $item['name'])
			];
		}

		// отправляем на сервер и сравниваем

		return 0;
	}


	/**
	 * Метод для очистки кеша установки шаблона
	 *
	 * @throws \Exception
	 */
	protected function deleteCache()
	{

		if (file_exists($this->filepath))
		{
			//удаляем архив
			if (!File::delete($this->filepath))
			{
				$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_DELETE_ZIP'), 'danger');
			}
		}

		if (file_exists($this->filepath_extract))
		{
			//удаляем временную папку
			if (!Folder::delete($this->filepath_extract))
			{
				$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_DELETE_TMP_FOLDER'), 'danger');
			}
		}

	}


}