/*
  Bootloader:
    STM32_Programmer_CLI -c port=jtag -log 3420-Bootloader.log -w ./3420-Bootloader.bin 0x08000000 -v
    STM32_Programmer_CLI -c port=jtag -g 0x08000000

  Application: 0x0800A000

private byte unitType = 0xFF;
private void buttonRepro_Click(object sender, EventArgs e)
{
    // Send reboot command - if running app - reboots to bootloader
    // by setting a flag in flash in the sector after the app load
    // address.
    MainForm.bReproInProgress = true;
    MainForm.bBootBootloaderOk = false;
    textBoxProgFile.Text = "Re-booting to bootloader...";

    CAN.CANTXSTRUCT pgn = new CAN.CANTXSTRUCT();
    pgn.PGN = 0x1CFFA5F0;   // PGN065445 SF Config Command
    pgn.DLC = 0x08;
    pgn.TxData = new byte[8];
    pgn.TxData[0] = 0xA1;   // Manufacturer Code, 
    pgn.TxData[1] = 0x98;   // Rsvd. bits & Indust. Gp 4.
    pgn.TxData[2] = unitType;
    pgn.TxData[3] = MainForm.reproUnitInstance;
    pgn.TxData[4] = 0xAA;   // Data ID for reboot.
    pgn.TxData[5] = 0xFF;   // RFU.
    pgn.TxData[6] = 0xFF;
    pgn.TxData[7] = 0xFF;
    CAN.SendCan(pgn);
    System.Windows.Forms.Application.DoEvents();
    // Wait Max 5 secs for the unit to reboot to bootloader and send
    // status pgn.


    for (int i = 0; i < 100; i++)
    {
        Thread.Sleep(100);
        System.Windows.Forms.Application.DoEvents();
        if (i == 50)
        {
            textBoxProgFile.Text = "Error Re-boot to bootloader Failed";
            MainForm.bReproInProgress = false;
            return;
        }
        if (MainForm.bBootBootloaderOk == true)
            break;
    }
    textBoxProgFile.Text = "Re-booting to bootloader...Done";
    System.Windows.Forms.Application.DoEvents();
    Thread.Sleep(300);

    string ChosenFile = "";
    string ChosenFileName = "";
    Int32 appLen = 0;
    OpenFileDialog ofd = new OpenFileDialog();
    FileStream fs = null;
    ofd.Title = "Choose Application Binary...";
    ofd.DefaultExt = "bin";
    ofd.Filter = "Application Binary (*.bin)|*.bin";
    if (ofd.ShowDialog() == DialogResult.OK)
    {
        ChosenFile = ofd.FileName;
        fs = new FileStream(ChosenFile, FileMode.Open, FileAccess.Read);
        appLen = (Int32)fs.Length;
        FileInfo fi = new FileInfo(ChosenFile);
        textBoxProgFile.Text = fi.Name;
        ChosenFileName = fi.Name;
        System.Windows.Forms.Application.DoEvents();
    } // End of if Open Dialog OK

    else goto tidyUpExitRepro;


    MainForm.bReproEraseOk = false;
    FPTx.FPTXSTRUCT PGN = new FPTx.FPTXSTRUCT();
    PGN.uiPGN = 0x1DFFA5F0;         // PGN130981 FP Config Command.
    PGN.uiLength = 9;
    PGN.FPData = new byte[135];
    PGN.FPData[0] = 0xA1;           // Man Code
    PGN.FPData[1] = 0x98;           // Rsvd. bits & Industry Gp 4.
    PGN.FPData[2] = unitType;
    PGN.FPData[3] = MainForm.reproUnitInstance;              // Bootloader default instance;
    PGN.FPData[4] = 0xEA;           // Data ID for erase start address.
    PGN.FPData[5] = (byte)(MainForm.KReproAppStartAddr & 0xFF);
    PGN.FPData[6] = (byte)((MainForm.KReproAppStartAddr >> 8) & 0xFF);
    PGN.FPData[7] = (byte)((MainForm.KReproAppStartAddr >> 16) & 0xFF);
    PGN.FPData[8] = (byte)((MainForm.KReproAppStartAddr >> 24) & 0xFF);
    FPTx.FPTransmit(ref PGN);

    // Command the erasure of appLen bytes
    PGN.FPData[4] = 0xEB;           // Data ID for send number of bytes
    PGN.FPData[5] = (byte)(appLen & 0xFF);
    PGN.FPData[6] = (byte)((appLen >> 8) & 0xFF);
    PGN.FPData[7] = (byte)((appLen >> 16) & 0xFF);
    PGN.FPData[8] = (byte)((appLen >> 24) & 0xFF);
    FPTx.FPTransmit(ref PGN);
    System.Windows.Forms.Application.DoEvents();

    // Wait Max 10 secs for Repro to ack (sectors erased)
    for (int i = 0; i < 100; i++)
    {
        Thread.Sleep(100);
        System.Windows.Forms.Application.DoEvents();
        if (i == 99)
        {
            textBoxProgFile.Text = "Error Erase App Sectors Failed";
            goto tidyUpExitRepro;
        }
        if (MainForm.bReproEraseOk == true)
            break;
    }

    // Now send the programming data in 128 byte blocks waiting after
    // each for success ack.
    int blockNum = 0;
    while (appLen > 0)
    {
        MainForm.bReproProgOk = false;
        PGN.uiLength = (uint)((appLen >= 135) ? 135 : appLen + 7);
        PGN.FPData[4] = 0xF0;           // Data ID for send program block
        PGN.FPData[5] = (byte)(blockNum & 0xFF);
        PGN.FPData[6] = (byte)((blockNum >> 8) & 0xFF);
        for (int i = 7; i < 135; i++)
        {
            PGN.FPData[i] = (byte)fs.ReadByte();
            appLen--;
        }
        FPTx.FPTransmit(ref PGN);
        System.Windows.Forms.Application.DoEvents();
        blockNum++;
        // Wait 1s for unit to ack (block Programmed)
        for (int i = 0; i < 100; i++)
        {
            Thread.Sleep(10);
            System.Windows.Forms.Application.DoEvents();
            if (i == 99)
            {
                textBoxProgFile.Text = "Error Prog Failed";
                goto tidyUpExitRepro;
            }
            if (MainForm.bReproProgOk == true)
                break;
        }
        textBoxProgFile.Text = "Programming " + ChosenFileName +
                                              " @ 0x" +
                                              MainForm.appProggedAddr.ToString(("X2"));
        System.Windows.Forms.Application.DoEvents();
    }
    textBoxProgFile.Text = textBoxProgFile.Text + " - Done";
    System.Windows.Forms.Application.DoEvents();
    Thread.Sleep(800);

    // Now ask the bootloader to CRC32 the application
    MainForm.appCrc32 = 0;
    pgn.TxData[3] = MainForm.reproUnitInstance;      // Default bootloader instance.
    pgn.TxData[4] = 0xFF;   // Data ID for request status.
    pgn.TxData[5] = 0x01;   // Will be fast packet.
    pgn.TxData[6] = 0xC2;   // Request CRC32
    CAN.SendCan(pgn);
    System.Windows.Forms.Application.DoEvents();
    // Wait 5s for unit to return the CRC32
    for (int i = 0; i < 50; i++)
    {
        Thread.Sleep(100);
        System.Windows.Forms.Application.DoEvents();
        if (i == 49)
        {
            textBoxProgFile.Text = "Error No CRC";
            goto tidyUpExitRepro;
        }
        if (MainForm.appCrc32 != 0)
            break;
    }
    Crc32 crc32 = new Crc32();
    byte[] data = File.ReadAllBytes(ChosenFile);
    if (MainForm.appCrc32 == crc32.ComputeChecksum(data))
    {
        textBoxProgFile.Text = "CRC32: 0x" + MainForm.appCrc32.ToString(("X2")) + "    PASS";
    }
    else
    {
        textBoxProgFile.Text = "CRC32: 0x" + MainForm.appCrc32.ToString(("X2")) + "    *FAIL*   Please try again.";
        goto tidyUpExitRepro;
    }
    System.Windows.Forms.Application.DoEvents();
    Thread.Sleep(1000);

    // Programmed OK so erase the bootloader boot flag from the sector
    // below the new app load address.
    MainForm.bReproEraseOk = false;
    PGN.uiLength = 9;
    PGN.FPData[4] = 0xEC;           // Data ID for erase flag
    PGN.FPData[5] = (byte)(0xFF);
    PGN.FPData[6] = (byte)(0xFF);
    PGN.FPData[7] = (byte)(0xFF);
    PGN.FPData[8] = (byte)(0xFF);
    FPTx.FPTransmit(ref PGN);
    System.Windows.Forms.Application.DoEvents();

    // Wait Max 2 secs for unit to ack (sectors erased)
    for (int i = 0; i < 20; i++)
    {
        Thread.Sleep(100);
        System.Windows.Forms.Application.DoEvents();
        if (i == 19)
        {
            textBoxProgFile.Text = "Error Erase Bootload Flag Failed";
            goto tidyUpExitRepro;
        }
        if (MainForm.bReproEraseOk == true)
            break;
    }

    // Send reboot command.
    pgn.TxData[4] = 0xAA;   // Data ID for re-boot.
    pgn.TxData[5] = 0xFF;   // RFU.
    pgn.TxData[6] = 0xFF;   //
    CAN.SendCan(pgn);
    textBoxProgFile.Text = "Re-booting to Application Code";

tidyUpExitRepro:
    // Close the IO Streams
    if (fs != null)
        fs.Close();
    MainForm.bReproInProgress = false;
}
*/

const progURL = 'http://localhost:4000';

const { app } = require('electron');
const log = require('electron-log');
const dwl = require('download');
const path = require('path');
const cp = require('child_process');

async function writeBoot(dev, func) {
  return new Promise((resolve, reject) => {
    let prog = null;
    let file = null;
    switch (dev) {
      case '3420':
        prog = 'STM32';
        file = '3420-Bootloader.bin'
        break;
      default:
        prog = 'Atmel';
        break;
    }
    if (file == null) {
      reject(new Error('Invalid request'));
      return;
    }
    let dwn = path.join(app.getAppPath(), 'downloads');
    dwl(progURL + '/boot?file=' + file, dwn).then((res) => {
      log.info('Download successful:', file);
      dwn = path.join(dwn, file);
      const chd = cp.spawn('STM32_Programmer_CLI', ['-c port=jtag', '-w', dwn,  '0x08000000', '-v']);
      chd.stdout.on('data', (data) => {
        let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
        func(msg);
        log.info(msg);
        return;
      });
      chd.stderr.on('data', (data) => {
        let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
        func(msg);
        log.error(msg);
        return;
      });
      chd.on('close', (code) => {
        resolve(code == 0);
      });
    }).catch((err) => {
      reject(err);
    });
  });
}

async function writeProg(args, eng, func) {
  return new Promise((resolve, reject) => {
    const [dev, mod, ins] = args;
    let file = null;
    switch (mod) {
      case '3420':
        file = '3420.bin'
        break;
      default:
        break;
    }
    if (file == null) {
      reject(new Error('Invalid request'));
      return;
    }
    dwl(progURL + '/prog?file=' + file, path.join(app.getAppPath(), 'downloads')).then((res) => {
      log.info('Download successful:', file);
      func('Download successful: ' + file);
      // Re-booting to bootloader...
      let ret = eng.send065445(0x08, ins, 0xAA, 0xFFFFFF);
      if (!ret) {
        reject(new Error('Re-boot to bootloader Failed'));
      }
      func('Bootloader successfuly re-booted');
      // Erasing program area
      ret = eng.send130981(0x08, ins, 0xAA, 0xFFFFFF);
      if (!ret) {
        reject(new Error('Re-boot to bootloader Failed'));
      }


        resolve(true);
    }).catch((err) => {
      reject(err);
    });
  });
}

module.exports = {
  writeBoot,
  writeProg,
};
