<?php namespace Radicalinstaller\Provider;

defined('_JEXEC') or die;

use Joomla\Archive\Zip;
use Joomla\CMS\Factory;
use Joomla\CMS\Http\Transport\CurlTransport;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Log\Log;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Version;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use Joomla\Registry\Registry;
use Radicalinstaller\API;
use Radicalinstaller\Config;

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
		Table::addIncludePath(JPATH_ROOT . '/plugins/installer/radicalinstaller/tables');
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
			$this->addMessage(Text::_('Не установлен YOOtheme Pro'), 'danger');

			return false;
		}

		$project = json_decode(API::project($id), JSON_OBJECT_AS_ARRAY);

		$zip = new Zip;

		if (!Zip::hasNativeSupport())
		{
			$this->addMessage(Text::_('Нет поддержки zip архивов'), 'danger');

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

		if (((new Version())->isCompatible('4.0')))
		{
			$body = $request->body;

			$body = (!empty($body)) ? $request->body : false;
		}
		else
		{
			$body = (!empty($response->body)) ? $response->body : false;
		}

		$body = json_decode($body, JSON_OBJECT_AS_ARRAY);

		//если сервер прислал ошибку, то пишем и выходим
		if ($request->code !== 200)
		{
			$this->addMessage(Text::_('Не удалось скачать архив с сервера'), 'warning');

			return false;
		}

		//если ключ установлен, но не находится такой на сервере
		if (is_array($body) && isset($body['message']) && ($body['message'] === 'forbidden'))
		{
			$this->addMessage(Text::_('Не правильный ключ'), 'warning');

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
							$keys[]      = $key;
							$names[]     = $item['name'];
							$items[$key] = $item;
						}
					}
				}

				// Add new items
				foreach ($files as $file)
				{
					$item = json_decode(file_get_contents($this->filepath_extract . DIRECTORY_SEPARATOR . $file), JSON_OBJECT_AS_ARRAY);

					if (!is_array($item))
					{
						return false;
					}

					$filename_split = explode('.', $file);
					$ext            = array_pop($filename_split);

					// Check name
					$key          = 'radicalinstaller_yoolayouts_' . $project['element'] . '_' . $item['name'];
					$item['name'] = $project['title'] . ' v' . $project['version']['version'] . '. ' . implode($filename_split);

					// Add to items
					$items[$key] = $item;
				}

				// Update plugin
				$yootheme->custom_data            = ($custom_data) ? $custom_data : array();
				$yootheme->custom_data['library'] = $items;
				$yootheme->custom_data            = json_encode($yootheme->custom_data);

				if (!$db->updateObject('#__extensions', $yootheme, array('extension_id')))
				{
					return false;
				}


				//записываем обновление
				$table = Table::getInstance('RadicalinstallerExtensions', 'Table');
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
				$table->project_id     = $project['id'];
				$table->category_title = $project['title'];
				$table->extension_id   = 0;

				if (!$table->check())
				{
					//Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_ZIP_EXTRACT'), Log::ERROR, 'plg_system_uikithikashop');
				}

				if (!$table->store())
				{
					//Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_ZIP_EXTRACT'), Log::ERROR, 'plg_system_uikithikashop');
				}

			}
		}

		$this->addMessage(Text::_('Макет был успешно установлен. Вы можете его увидеть в макетах конструктора YOOtheme PRO'));

		return true;

	}


	public function delete($id)
	{
		$db         = Factory::getDbo();
		$query      = $this->db->getQuery(true);
		$conditions = [
			$db->quoteName('project_id') . ' = ' . (int) $id,
		];
		$query->delete($db->quoteName('#__radicalinstaller_extensions'));
		$query->where($conditions);
		$db->setQuery($query);

		$this->addMessage(Text::_('Макет был успешно удален'));

		return $db->execute();
	}


	public function toggleEnable($id)
	{
		// TODO: Implement toggleEnable() method.
	}


	public function toggleDisable($id)
	{
		// TODO: Implement toggleDisable() method.
	}


	public function addMessage($msg, $type = 'info')
	{
		$this->messages[] = ['message' => $msg, 'type' => $type];
	}


	public function getMessages()
	{
		return $this->messages;
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
				Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_DELETE_ZIP'), Log::ERROR, 'plg_system_uikithikashop');
				Factory::getApplication()->enqueueMessage(Text::_('PLG_UIKIT_HIKASHOP_ERROR_DELETE_ZIP'), 'notice');
			}
		}

		if (file_exists($this->filepath_extract))
		{
			//удаляем временную папку
			if (!Folder::delete($this->filepath_extract))
			{
				Log::add(Text::_('PLG_UIKIT_HIKASHOP_ERROR_DELETE_TMP_FOLDER'), Log::ERROR, 'plg_system_uikithikashop');
				Factory::getApplication()->enqueueMessage(Text::_('PLG_UIKIT_HIKASHOP_ERROR_DELETE_TMP_FOLDER'), 'notice');
			}
		}

	}


}