<?php namespace Sovmart\Provider\Collections;

defined('_JEXEC') or die;

use Joomla\Archive\Zip;
use Joomla\CMS\Factory;
use Joomla\CMS\Http\Transport\CurlTransport;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use Joomla\Registry\Registry;
use Sovmart\API;
use Sovmart\Config;
use Sovmart\Provider\ProviderInterface;

class ProviderYoolayouts implements ProviderInterface
{


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

		$zip = new Zip;

		if (!Zip::hasNativeSupport())
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_ZIP'), 'error');

			return false;
		}

		// проверка
		$this->filepath         = JPATH_ROOT . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . md5(date('U'));
		$this->filepath_extract = JPATH_ROOT . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . md5('extract_' . date('U'));

		$data = http_build_query([
			'option'  => 'com_swjprojects',
			'view'    => 'download',
			'element' => $project['element'],
			'api_key' => $this->config['api_key'],
		]);

		$curlTransport = new CurlTransport(new Registry());
		$url_curl      = (new Uri());
		$url_curl->setScheme($this->scheme);
		$url_curl->setHost($this->host);
		$request = $curlTransport->request('GET', $url_curl, $data);

		//если сервер прислал ошибку, то пишем и выходим
		if ($request->code !== 200)
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_ARCHIVE_SERVICE'), 'error');

			return false;
		}

		$body = (!empty($request->body)) ? $request->body : false;
		$body = json_decode($body, true);

		//если ключ установлен, но не находится такой на сервере
		if (is_array($body) && isset($body['message']) && ($body['message'] === 'forbidden'))
		{
			$this->addMessage(Text::_('PLG_INSTALLER_SOVMART_ERROR_KEY'), 'error');

			return false;
		}

		//пишем ответ в файл
		File::write($this->filepath, $request->body);

		//проверяем архив ли
		if ($zip->checkZipData($request->body))
		{

			//вытаскиваем данные из архива
			if ($zip->extract($this->filepath, $this->filepath_extract))
			{
				$files         = Folder::files($this->filepath_extract);
				$names_install = [];

				// Get current

				$keys  = [];
				$names = [];
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
						return false;
					}

					$filename_split = explode('.', $file);
					$ext            = array_pop($filename_split);

					// Check name
					$key          = 'sovmart_yoolayouts_' . $project['element'] . '_' . $item['name'];
					$item['name'] = $project['title'] . ' v' . $project['version']['version'] . ((count($files) > 1) ? ('. ' . implode($filename_split)) : '');

					// Add to items
					$items[$key] = $item;
				}

				// Update plugin
				$yootheme->custom_data            = ($custom_data) ?: array();
				$yootheme->custom_data['library'] = $items;
				$yootheme->custom_data            = json_encode($yootheme->custom_data);

				if (!$db->updateObject('#__extensions', $yootheme, array('extension_id')))
				{
					return false;
				}

				//записываем обновление
				$table = Table::getInstance('SovmartExtensions', 'Table');
				$table->load([
					'provider' => $project['provider'],
					'element'  => $project['element'],
				]);

				$table->provider       = $project['provider'];
				$table->title          = $project['title'];
				$table->type           = 'layout';
				$table->element        = $project['element'];
				$table->folder         = '';
				$table->version        = $project['version']['version'];
				$table->branch         = 'stable';
				$table->project_id     = $project['id'];
				$table->category_title = $project['title'];
				$table->extension_id   = 0;

				if (!$table->check())
				{
					return false;
					//Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_ZIP_EXTRACT'), Log::ERROR, 'plg_system_uikithikashop');
				}

				if (!$table->store())
				{
					return false;
					//Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_ZIP_EXTRACT'), Log::ERROR, 'plg_system_uikithikashop');
				}

			}
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
					if (strpos($key, 'sovmart_yoolayouts_' . $project['element']) !== false)
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
		// смотрим на локальные

		// собираем коллекцию с версиями и названием element

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