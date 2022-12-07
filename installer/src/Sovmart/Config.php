<?php namespace Sovmart;

defined('_JEXEC') or die;

// TODO переписать весь класс, перенести на Registry джумловый

class Config
{

	/**
	 * @var string
	 * @since version
	 */
	public static $scheme = 'https';

	/**
	 * @var string
	 * @since version
	 */
	public static $host = 'sovmart.ru';

	/**
	 * @var string
	 * @since version
	 */
	public static $path = '/api/v1/';

}