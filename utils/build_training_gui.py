# Created by Danit Gino at June 2020
# All rights reserved

# -*- coding: utf-8 -*-

###########################################################################
## Python code generated with wxFormBuilder (version Oct 26 2018)
## http://www.wxformbuilder.org/
##
## PLEASE DO *NOT* EDIT THIS FILE!
###########################################################################

import wx
import wx.xrc
import pyperclip
from time import sleep
from sys import platform
from decouple import config
from threading import Thread
from os import system, path, remove
from warnings import filterwarnings
try:
    from .build_training import build_training, build_pre_check, clean_exitsting_training, info, error, clear_logfile, logfile
except ImportError:
    from build_training import build_training, build_pre_check, clean_exitsting_training, info, error, clear_logfile, logfile

if platform == "linux" or platform == "linux2":
    filterwarnings("ignore")

BASE_DIR = path.dirname(path.dirname(path.abspath(__file__)))
MEDIA_ROOT = path.join(BASE_DIR, 'media')

###########################################################################
## Class MyFrame
###########################################################################

class MyFrame ( wx.Frame ):

    def __init__( self, parent ):
        wx.Frame.__init__ ( self, parent, id = wx.ID_ANY, title = wx.EmptyString, pos = wx.DefaultPosition, size = wx.Size( 1040,650 ), style = wx.DEFAULT_FRAME_STYLE|wx.TAB_TRAVERSAL )

        self.SetSizeHints( wx.DefaultSize, wx.DefaultSize )

        bSizer0 = wx.BoxSizer( wx.HORIZONTAL )

        bSizer1 = wx.BoxSizer( wx.VERTICAL )

        self.m_staticText = wx.StaticText( self, wx.ID_ANY, u"Sea Analytics - Build Training GUI", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText.Wrap( -1 )

        self.m_staticText.SetFont( wx.Font( 13, wx.FONTFAMILY_DEFAULT, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Lucida Grande" ) )

        bSizer1.Add( self.m_staticText, 0, wx.ALIGN_CENTER|wx.ALL, 5 )

        self.m_staticline1 = wx.StaticLine( self, wx.ID_ANY, wx.DefaultPosition, wx.DefaultSize, wx.LI_HORIZONTAL )
        bSizer1.Add( self.m_staticline1, 0, wx.EXPAND |wx.ALL, 5 )

        gSizer1 = wx.FlexGridSizer( 1, 3, 0, 0 )

        self.m_staticText0 = wx.StaticText( self, wx.ID_ANY, u"CSV MAP Path", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText0.Wrap( -1 )

        gSizer1.Add( self.m_staticText0, 0, wx.ALL|wx.ALIGN_CENTER_VERTICAL, 5 )

        self.m_textCtrl0 = wx.TextCtrl( self, wx.ID_ANY, config('GUI_CSV_MAP', default='NA'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl0.SetMinSize( wx.Size( 250,-1 ) )

        gSizer1.Add( self.m_textCtrl0, 0, wx.ALL|wx.ALIGN_CENTER_HORIZONTAL|wx.ALIGN_CENTER_VERTICAL, 5 )

        self.m_button0 = wx.Button( self, wx.ID_ANY, u"Browse", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_button0.Bind(wx.EVT_BUTTON, self.OnBrowse)        

        gSizer1.Add( self.m_button0, 0, wx.ALL|wx.ALIGN_RIGHT|wx.ALIGN_CENTER_VERTICAL, 5 )

        gSizer1.SetHGap(33)

        bSizer1.Add( gSizer1, 1, wx.EXPAND, 5 )

        gSizer2 = wx.GridSizer( 2, 2, 0, 0 )

        self.m_staticText7 = wx.StaticText( self, wx.ID_ANY, u"Media Resolution", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText7.Wrap( -1 )

        gSizer2.Add(self.m_staticText7, 0, wx.ALL | wx.ALIGN_CENTER_VERTICAL, 5)

        self.m_mediaResChoice = wx.Choice( self, choices=['low', 'high'])
        self.m_mediaResChoice.SetSelection(int(config('GUI_MEDIA_RESOLUTION', default='0')))

        gSizer2.Add( self.m_mediaResChoice, 0, wx.ALL|wx.ALIGN_CENTER_VERTICAL, 5 )

        self.m_staticText1 = wx.StaticText( self, wx.ID_ANY, u"Training ID", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText1.Wrap( -1 )

        gSizer2.Add( self.m_staticText1, 0, wx.ALL|wx.ALIGN_CENTER_VERTICAL, 5 )

        self.m_textCtrl1 = wx.TextCtrl( self, wx.ID_ANY, config('GUI_TRAINING_ID', default='123456'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl1.SetMinSize( wx.Size( 250,-1 ) )

        gSizer2.Add( self.m_textCtrl1, 0, wx.ALL|wx.ALIGN_CENTER_VERTICAL, 5 )


        bSizer1.Add( gSizer2, 1, wx.EXPAND, 5 )

        self.m_staticline2 = wx.StaticLine( self, wx.ID_ANY, wx.DefaultPosition, wx.DefaultSize, wx.LI_HORIZONTAL )
        bSizer1.Add( self.m_staticline2, 0, wx.EXPAND |wx.ALL, 5 )

        gSizer3 = wx.GridSizer( 7, 2, 0, 0 )

        self.m_staticText2 = wx.StaticText( self, wx.ID_ANY, u"Trainee Video Duration [sec]", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText2.Wrap( -1 )

        gSizer3.Add( self.m_staticText2, 0, wx.ALL, 5 )

        self.m_textCtrl2 = wx.TextCtrl( self, wx.ID_ANY, config('GUI_TRAINEE_VIDEO_DURATION', default='30'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl2.SetMinSize( wx.Size( 250,-1 ) )

        gSizer3.Add( self.m_textCtrl2, 0, wx.ALL, 5 )

        self.m_staticText3 = wx.StaticText( self, wx.ID_ANY, u"Trainee Smoothing Factor", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText3.Wrap( -1 )

        gSizer3.Add( self.m_staticText3, 0, wx.ALL, 5 )

        self.m_textCtrl3 = wx.TextCtrl( self, wx.ID_ANY, config('GUI_TRAINEE_SMOOTHING_FACTOR', default='10'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl3.SetMinSize( wx.Size( 250,-1 ) )

        gSizer3.Add( self.m_textCtrl3, 0, wx.ALL, 5 )
        
        self.m_staticText3a = wx.StaticText( self, wx.ID_ANY, u"Trainee Skip Start", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText3a.Wrap( -1 )

        gSizer3.Add( self.m_staticText3a, 0, wx.ALL, 5 )

        self.m_textCtrl3a = wx.TextCtrl( self, wx.ID_ANY, config('GUI_TRAINEE_SKIP_START', default='180'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl3a.SetMinSize( wx.Size( 250,-1 ) )

        gSizer3.Add( self.m_textCtrl3a, 0, wx.ALL, 5 )

        self.m_staticText4 = wx.StaticText( self, wx.ID_ANY, u"Trainee Time Hours Offset", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText4.Wrap( -1 )

        gSizer3.Add( self.m_staticText4, 0, wx.ALL, 5 )

        self.m_textCtrl4 = wx.TextCtrl( self, wx.ID_ANY, config('GUI_TRAINEE_TIME_HOURS_OFFSET', default='3'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl4.SetMinSize( wx.Size( 250,-1 ) )

        gSizer3.Add( self.m_textCtrl4, 0, wx.ALL, 5 )

        self.m_staticText5a = wx.StaticText( self, wx.ID_ANY, u"Trainer Time Seconds Offset Video", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText5a.Wrap( -1 )

        gSizer3.Add( self.m_staticText5a, 0, wx.ALL, 5 )

        self.m_textCtrl5a = wx.TextCtrl( self, wx.ID_ANY, config('GUI_TRAINER_TIME_SEC_OFFSET_VIDEO', default='18'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl5a.SetMinSize( wx.Size( 250,-1 ) )

        gSizer3.Add( self.m_textCtrl5a, 0, wx.ALL, 5 )

        self.m_staticText5b = wx.StaticText( self, wx.ID_ANY, u"Trainer Time Seconds Offset Audio", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText5b.Wrap( -1 )

        gSizer3.Add( self.m_staticText5b, 0, wx.ALL, 5 )

        self.m_textCtrl5b = wx.TextCtrl( self, wx.ID_ANY, config('GUI_TRAINER_TIME_SEC_OFFSET_AUDIO', default='3'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl5b.SetMinSize( wx.Size( 250,-1 ) )

        gSizer3.Add( self.m_textCtrl5b, 0, wx.ALL, 5 )

        self.m_staticText6 = wx.StaticText( self, wx.ID_ANY, u"Cloud URL", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_staticText6.Wrap( -1 )

        gSizer3.Add( self.m_staticText6, 0, wx.ALL, 5 )

        self.m_textCtrl6 = wx.TextCtrl( self, wx.ID_ANY, config('GUI_CLOUD_URL', default='http://sea-analytics-v2.herokuapp.com'), wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_textCtrl6.SetMinSize( wx.Size( 250,-1 ) )

        gSizer3.Add( self.m_textCtrl6, 0, wx.ALL, 5 )

        bSizer1.Add( gSizer3, 1, wx.EXPAND, 5 )

        self.m_staticline3 = wx.StaticLine( self, wx.ID_ANY, wx.DefaultPosition, wx.DefaultSize, wx.LI_HORIZONTAL )
        bSizer1.Add( self.m_staticline3, 0, wx.EXPAND |wx.ALL, 5 )

        self.m_checkBox1 = wx.CheckBox( self, wx.ID_ANY, u"Don't Publish", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_checkBox1.SetValue(bool(int(config('GUI_DONT_PUBLISH', default='0'))))
        bSizer1.Add( self.m_checkBox1, 0, wx.ALL, 5 )

        self.m_checkBox2 = wx.CheckBox( self, wx.ID_ANY, u"Only Publish", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_checkBox2.SetValue(bool(int(config('GUI_ONLY_PUBLISH', default='0'))))
        bSizer1.Add( self.m_checkBox2, 0, wx.ALL, 5 )

        self.m_checkBox3 = wx.CheckBox( self, wx.ID_ANY, u"Only Check", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_checkBox3.SetValue(bool(int(config('GUI_ONLY_CHECK', default='0'))))
        bSizer1.Add( self.m_checkBox3, 0, wx.ALL, 5 )

        self.m_checkBox4 = wx.CheckBox( self, wx.ID_ANY, u"Overwrite Existing", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_checkBox4.SetValue(bool(int(config('GUI_OVERWRITE_EXISTING', default='0'))))
        bSizer1.Add( self.m_checkBox4, 0, wx.ALL, 5 )

        self.m_checkBox5 = wx.CheckBox( self, wx.ID_ANY, u"Debug Mode", wx.DefaultPosition, wx.DefaultSize, 0 )
        self.m_checkBox5.SetValue(bool(int(config('GUI_DEBUG_MODE', default='0'))))
        bSizer1.Add( self.m_checkBox5, 0, wx.ALL, 5 )

        self.m_staticline4 = wx.StaticLine( self, wx.ID_ANY, wx.DefaultPosition, wx.DefaultSize, wx.LI_HORIZONTAL )
        bSizer1.Add( self.m_staticline4, 0, wx.EXPAND |wx.ALL, 5 )

        self.m_button1 = wx.Button( self, wx.ID_ANY, u"Build Training", wx.DefaultPosition, wx.Size( -1,-1 ), 0 )
        self.m_button1.SetFont( wx.Font( 13, wx.FONTFAMILY_DEFAULT, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Lucida Grande" ) )
        self.m_button1.Bind(wx.EVT_BUTTON, self.OnClicked1)
        bSizer1.Add( self.m_button1, 0, wx.ALIGN_CENTER|wx.ALL|wx.SHAPED, 5 )
        
        self.m_button2 = wx.Button( self, wx.ID_ANY, u"Run Local Server", wx.DefaultPosition, wx.Size( -1,-1 ), 0 )
        self.m_button2.SetFont( wx.Font( 13, wx.FONTFAMILY_DEFAULT, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Lucida Grande" ) )
        self.m_button2.Bind(wx.EVT_BUTTON, self.OnClicked2)
        bSizer1.Add( self.m_button2, 0, wx.ALIGN_CENTER|wx.ALL|wx.SHAPED, 5 )

        bSizer0.Add(bSizer1, 1, wx.EXPAND, 5)

        bSizer2 = wx.BoxSizer(wx.VERTICAL)
        bSizer3 = wx.BoxSizer(wx.VERTICAL)
        self.m_staticText10 = wx.StaticText(self, wx.ID_ANY, u"Console", wx.DefaultPosition, wx.DefaultSize, 0)
        self.m_staticText10.Wrap(-1)
        self.m_staticText10.SetFont(wx.Font(13, wx.FONTFAMILY_DEFAULT, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Lucida Grande"))
        bSizer3.Add(self.m_staticText10, 0, wx.ALL, 5)
        bSizer2.Add(bSizer3, 0, wx.ALL, 5)

        bSizer4 = wx.BoxSizer( wx.VERTICAL )
        self.panel1 = wx.Panel(self, wx.ID_ANY)
        self.log = wx.TextCtrl(self.panel1, wx.ID_ANY, size=(500, 550), style=wx.TE_MULTILINE|wx.TE_READONLY|wx.HSCROLL)
        bSizer4.Add( self.panel1, 1, wx.ALL, 5 )
        bSizer2.Add( bSizer4, 0, wx.ALL, 5 )

        self.m_button3 = wx.Button( self, wx.ID_ANY, u"Copy", wx.DefaultPosition, wx.Size( -1,-1 ), 0 )
        self.m_button3.SetFont( wx.Font( 13, wx.FONTFAMILY_DEFAULT, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Lucida Grande" ) )
        self.m_button3.Bind(wx.EVT_BUTTON, self.OnClicked3)
        bSizer2.Add( self.m_button3, 0, wx.ALIGN_CENTER|wx.ALL|wx.SHAPED, 5 )

        bSizer0.Add(bSizer2, 1, wx.EXPAND, 5)

        self.SetSizer( bSizer0 )
        self.Layout()

        self.Centre( wx.BOTH )

    def __del__( self ):
        pass

    def OnBrowse(self, event):
        openFileDialog = wx.FileDialog(self, "Open", "", "", 
                                       "CSV files (*.csv)|*.csv", 
                                       wx.FD_OPEN | wx.FD_FILE_MUST_EXIST)
        openFileDialog.ShowModal()
        csv_map_path = openFileDialog.GetPath()
        self.m_textCtrl0.SetValue(csv_map_path)
        openFileDialog.Destroy()

    def OnClicked1(self, event):
        self.m_button1.Disable()
        clear_logfile()
        self.th1 = Thread(target=self.blocking_code)
        self.th2 = Thread(target=self.blocking_code2)
        self.th1.start()
        self.th2.start()

    def console_update(self):
        if path.exists(logfile):
            with open(logfile, 'r') as logger:
                self.log.Clear()
                self.log.WriteText(logger.read())

    def blocking_code2(self):
        while self.th1.is_alive():
            sleep(1)
            wx.CallAfter(self.console_update)

    def blocking_code(self):
        csv_map = self.m_textCtrl0.GetValue()
        training_id = self.m_textCtrl1.GetValue()
        media_resolution = self.m_mediaResChoice.GetString(self.m_mediaResChoice.GetSelection())
        video_duration_sec = self.m_textCtrl2.GetValue()
        trainee_smoothing_factor = self.m_textCtrl3.GetValue()
        trainee_skip_start = self.m_textCtrl3a.GetValue()
        trainee_time_hours_offset = self.m_textCtrl4.GetValue()
        trainer_time_sec_offset_video = self.m_textCtrl5a.GetValue()
        trainer_time_sec_offset_audio = self.m_textCtrl5b.GetValue()
        cloud_url = self.m_textCtrl6.GetValue()
        dont_publish = self.m_checkBox1.GetValue()
        only_publish = self.m_checkBox2.GetValue()
        only_check = self.m_checkBox3.GetValue()
        overwrite_en = self.m_checkBox4.GetValue()
        debug_en = self.m_checkBox5.GetValue()
        outdir = path.join(MEDIA_ROOT, "training_%s" % training_id)

        pre_checks_pass = build_pre_check(csv_map,
                                          training_id,
                                          media_resolution,
                                          cloud_url,
                                          debug_en)

        overwrite_pass = True
        if overwrite_en and pre_checks_pass:
            overwrite_pass = clean_exitsting_training(training_id, debug_en)

        if not only_check and pre_checks_pass and overwrite_pass:

            res = build_training(csv_map,
                                 training_id,
                                 media_resolution,
                                 cloud_url,
                                 video_duration_sec,
                                 outdir,
                                 dont_publish,
                                 only_publish,
                                 trainee_smoothing_factor,
                                 trainee_skip_start,
                                 trainee_time_hours_offset,
                                 trainer_time_sec_offset_video,
                                 trainer_time_sec_offset_audio,
                                 debug_en)

            if res:
                info("Completed Successfully!")
            else:
                error("Completed Abnormally!")

        wx.CallAfter(self.m_button1.Enable)

    def OnClicked2(self, event):
        cmd = 'python manage.py runserver &'
        system(cmd)

    def OnClicked3(self, event):
        pyperclip.copy(self.log.GetValue())

if __name__ == '__main__':

    app = wx.App(False)
    frame = MyFrame(None)
    frame.Show()
    app.MainLoop()

