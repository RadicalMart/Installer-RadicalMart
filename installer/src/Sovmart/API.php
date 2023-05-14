<?php namespace Sovmart;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Http\Transport\CurlTransport;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Version;
use Joomla\Registry\Registry;
use stdClass;

// TODO переписать весь класс

class API
{


	/**
	 *
	 * @var string[]
	 * @since version
	 */
	private static $data_request = [];

	/**
	 *
	 * @var string[]
	 * @since version
	 */
	private static $data_headers = [];

	/**
	 * @param $key
	 *
	 *
	 * @since version
	 */
	public static function setKey($key)
	{
		static::$data_request['key'] = $key;
	}

	/**
	 * @param $token
	 *
	 *
	 * @since version
	 */
	public static function setToken($token)
	{
		static::$data_headers['Authorization'] = 'Bearer ' . $token;
	}

	public static function getProjectDownload($id, $full = true)
	{
		if ($full)
		{
			$uri = (new Uri());
			$uri->setScheme(Config::$scheme);
			$uri->setHost(Config::$host);
			$uri->setPath(Config::$path . 'projects/download/' . $id);

			return $uri->toString();
		}

		return 'projects/download/' . $id;
	}

	public static function minimal()
	{
		return self::execute('minimal');
	}

	public static function checkToken()
	{
		return self::execute('token/check');
	}

	public static function categories()
	{
		return self::execute('categories');
	}

	public static function groupsStartPage()
	{
		return self::execute('startpage');
	}

	public static function projects($category_id, $page = 1, $limit = 12)
	{
		return self::execute('projects', [
			'category_id' => $category_id,
			'page'        => $page,
			'limit'       => $limit
		]);
	}

	public static function projectDownload($id)
	{
		return self::execute('projects/download/' . $id);
	}

	public static function projectList($ids)
	{
		return self::execute('projects/ids', ['projects_ids' => $ids]);
	}

	public static function project($id)
	{
		return self::execute('projects/' . $id);
	}

	public static function projectsPaid()
	{
		return self::execute('projects/paid');
	}

	public static function projectsFree()
	{
		return self::execute('projects/free');
	}

	public static function projectListCheckVersion($ids)
	{
		return self::execute('projects/checkversion', ['projects_ids' => json_encode($ids)]);
	}

	public static function syncExtensions($provider, $list = '')
	{
		return self::execute(
			'projects/sync',
			['provider' => $provider, 'extensions' => $list],
			'POST'
		);
	}

	public static function search($search)
	{
		return self::execute('search', ['q' => $search]);
	}

	public static function request($method, $data = [], $type = 'GET')
	{
		if (JDEBUG)
		{
			return static::requestDebug($method, $data, $type);
		}


		$curlTransport = new CurlTransport(new Registry());
		$uri           = (new Uri());
		$uri->setScheme(Config::$scheme);
		$uri->setHost(Config::$host);
		$uri->setPath(Config::$path . $method);

		$lang = Factory::getLanguage();
		$uri->setVar('lang', $lang->getTag());

		$version = (new Version)->getShortVersion();
		$uri->setVar('targetplatform', 'joomla');
		$uri->setVar('targetversion', $version);

		$data_build = [];

		// если отдать data для метода request объекта $curlTransport, то он тогда формирует как POST запрос, чтобы избежать этого, формирую переменные в объекте Uri через setVar
		if ($type === 'GET')
		{
			$data_tmp = array_merge($data, static::$data_request);
			foreach ($data_tmp as $key => $value)
			{
				$uri->setVar($key, $value);
			}
		}
		else
		{
			$data_build = array_merge($data, static::$data_request);
		}

		$response = $curlTransport->request($type, $uri, (count($data_build) > 0 ? $data_build : null), static::$data_headers);

		$output       = new stdClass();
		$output->code = $response->code;
		$output->body = (string) $response->body;

		return $output;
	}

	private static function requestDebug($method, $data = [], $type = 'GET')
	{
		$url     = Config::$scheme . '://' . Config::$host . Config::$path . $method;
		$lang    = Factory::getLanguage();
		$version = (new Version)->getShortVersion();

		$data_build = http_build_query(
			array_merge($data, static::$data_request, [
				'lang'           => $lang->getTag(),
				'targetplatform' => 'joomla',
				'targetversion'  => $version,
			])
		);

		$headers_build = [];

		foreach (static::$data_headers as $key => $value)
		{
			$headers_build[] = $key . ': ' . $value;
		}

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_build);
		curl_setopt($ch, CURLOPT_HEADER, 1);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

		if ($type === 'GET')
		{
			curl_setopt($ch, CURLOPT_URL, $url . '?' . $data_build);
		}

		if ($type === 'POST')
		{
			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $data_build);
		}


		$response    = curl_exec($ch);
		$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
		$header      = substr($response, 0, $header_size);
		$body        = substr($response, $header_size);

		$output       = new stdClass();
		$output->code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$output->body = $body;

		curl_close($ch);

		return $output;
	}

	/**
	 * @param          $method
	 * @param   array  $data
	 *
	 * @return string|bool
	 *
	 * @since version
	 */
	private static function execute($method, $data = [], $type = "GET")
	{
		return static::request($method, $data, $type)->body;
	}

}