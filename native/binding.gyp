{
  'targets': [
    {
      'target_name': 'overlay_window',
      'sources': [
        'src/addon.c',
        'src/napi_helpers.c',
        'src/windows.c'
      ],
      'include_dirs': [
        'src'
      ],
      'defines': [
        'WIN32_LEAN_AND_MEAN'
      ],
      'link_settings': {
        'libraries': [
          'oleacc.lib',
          'ole32.lib',
          'oleaut32.lib'
        ]
      }
    }
  ]
}
