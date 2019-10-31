const TeamFortress2 = require('tf2');
const chunk = require('chunk');

class Waste {
  constructor(client, opts) {
    this.client = client;
    this.tf2 = new TeamFortress2(client);

    this.safeMode = opts.safeMode || false;

    // this.itemNames = {};
    this.weaponsByClass = {
      scout: [
        44, 45, 46, 163, 220, 221, 222, 317, 325, 349, 355, 448, 449, 450, 648,
        772, 773, 812, 833, 1103
      ], soldier: [
        127, 128, 129, 133, 154, 226, 228, 237, 354, 357, 414, 415, 416, 441, 442,
        444, 447, 474, 513, 730, 775, 939, 1101, 1104, 1153
      ], pyro: [
        38, 39, 40, 153, 214, 215, 326, 348, 351, 457, 593, 594, 595, 739, 740,
        741, 813, 834, 1178, 1179, 1180, 1181
      ], demoman: [
        130, 131, 132, 172, 265, 307, 308, 327, 404, 405, 406, 482, 608, 609, 996,
        1099, 1150, 1151
      ], heavy: [
        41, 42, 43, 159, 239, 310, 311, 312, 331, 424, 425, 426, 656, 811, 832, 1190
      ], engineer: [
        140, 141, 142, 155, 329, 527, 528, 588, 589, 997
      ], medic: [
        35, 36, 37, 173, 304, 305, 411, 412, 413, 998
      ], sniper: [
        56, 57, 58, 171, 230, 231, 232, 401, 402, 526, 642, 751, 752, 1092, 1098
      ], spy: [
        59, 60, 61, 224, 225, 356, 460, 461, 525, 649, 810, 831
      ]
    };

    this.weapons = [];

    Object.keys(this.weaponsByClass).forEach(cls => {
      this.weaponsByClass[cls].forEach(index => {
        this.weapons.push(index);
      })
    });

    this.crap = [
      166, 241, 261, 536, 537, 655, 673, 994, 5022, 5083, 5718, 5734, 5742, 5752,
      5781, 5802, 5803, 5849, 5859, 5867, 5871, 5875, 5888, 5893, 5894, 5897, 5902,
      5904, 5905
    ];
  }

  start() {
    console.log("HI");
    var self = this;
  
    this.client.gamesPlayed([440]);

    const timeout = setTimeout(() => {
      console.log('No GC messages received');
      this.tf2.removeAllListeners('backpackLoaded');
      this.client.gamesPlayed([]);
      this.start();
    }, 1000 * 60);

    // if (fs.existsSync('itemSchema.json')) {
    //   self.tf2.itemSchema = JSON.parse(fs.readFileSync('itemSchema.json'));
    //   self.tf2.emit('itemSchemaLoaded');
    // }
  
    // this.tf2.once('connectedToGC', function() {
    //   console.log('connectedToGC\n');
    // });
  
    // this.tf2.once('accountLoaded', function() {
    //   if (!self.tf2.premium) {
    //     console.log('Account is f2p');
    //   }
    // });
  
    this.tf2.once('backpackLoaded', () => {
      clearTimeout(timeout);
      console.log('bp loaded');
      // if (!self.tf2.itemSchema) {
      //   console.log('Waiting on schema');
      //   self.tf2.once('itemSchemaLoaded', () => {
      //     //self.getNameById();
      //     self.main();
      //   });
      // } else {
      //   //self.getNameById();
      //   self.main();
      // }
      // this.tf2.backpack.forEach(item => {
      //   if (item.id == 8164536754) {
      //     console.log(item);
      //   }
      // });
      //process.exit();
      self.main();
    });
  
    // this.tf2.once('itemSchemaLoaded', function() {
    //   console.log('schema loaded');
    //   fs.writeFileSync('itemSchema.json', JSON.stringify(self.tf2.itemSchema, null, 4));
    // });
  }

  async main() {
    var self = this;

    // if (self.mapGifts().length > 0) {
    //   self.mapGifts().forEach(function(item) {
    //     console.log('Unwrapping => ' + self.itemNames[item] + '...')
    //     self.tf2.unwrapGift(item);
    //   });
  
    //   setTimeout(function() {
    //     return self.main();
    //   }, 3000);
  
    // } else 
    if (self.mapCrap().length > 0) {
      //self.getNameById();
      self.deleteCrapStep(self.mapCrap());
    } else if (self.mapWeps()) {
      //self.getNameById();
      var weps = self.mapWeps();
      //var classes = Object.keys(weps);
  
      for (const cls of Object.keys(weps)) {
        if (weps[cls].length > 1)  {
          console.log(`Crafting ${cls} weapons...`);
          await self.craftWepsStep(weps[cls]);
        } 
      }
      this.main();
    } else if (self.mapMetal(5000).length > 2) {
      console.log('Crafting scrap...');
      await self.craftMetalStep(self.mapMetal(5000));
      this.main();
    } else if (self.mapMetal(5001).length > 2) {
      console.log('Crafting reclaimed...');
      await self.craftMetalStep(self.mapMetal(5001));
      this.main();
    } else {
      console.log('\nThere\'s nothing (else) to craft');
      //self.getNameById();
      self.tf2.sortBackpack(3);
      // var bp = self.parseBP();
      // var sortable = [];
  
      // for (var item in bp)
      //   sortable.push([item, bp[item]]);
      // sortable.sort(function(a, b) {
      //   return a[1] - b[1]
      // });
  
      // bp = sortable.reverse()
  
      console.log('We have ' + self.tf2.backpack.length + ' items');
      console.log('Wasting complete');
      this.client.gamesPlayed([]);
      setTimeout(() => this.start(), 1000 * 60);
    }
  }

  mapGifts() {
    return this.tf2.backpack.filter((item) => item.id == 5085);
  }

  mapCrap() {
    return this.tf2.backpack.filter((item) => {
      return item.quality == 6 && this.crap.includes(item.def_index);
    }).map((item) => item.id);
    // var self = this;
    // var array = [];
    // var backpack = self.tf2.backpack.filter(function(item) {
    //   const isGift = item.attribute.some((attr) => {
    //     return attr.def_index == 185 || attr.def_index == 186;
    //   });
    //   return (
    //     isGift == false &&
    //     item.quality == 6 &&
    //     item.craft_class != 'craft_bar'
    //   );
    // });
  
    // backpack.forEach(function(item) {
    //   if (self.crap.indexOf(item.def_index) > -1 || item.origin == 17) {
    //     array.push(item.id);
    //   }
    // })
  
    // self.tf2.backpack.forEach(function(item) {
    //   if (item.flags == 20) {
    //     Object.keys(self.weaponsByClass).forEach(function(cls) {
    //       if (self.weaponsByClass[cls].indexOf(item.def_index) > -1) {
    //         array.push(item.id);
    //       }
    //     })
    //   }
    // })
  
    // if (!self.safeMode) {
    //   self.tf2.backpack.forEach(function(item) {
    //     if (item.attribute.length > 0) {
    //       item.attribute.forEach(function(attr) {
    //         if (attr.def_index == 153) {
    //           array.push(item.id);
    //         } else if (attr.def_index == 211) {
    //           Object.keys(self.weaponsByClass).forEach(function(cls) {
    //             if (self.weaponsByClass[cls].indexOf(item.def_index) > -1) {
    //               array.push(item.id);
    //             }
    //           })
    //         }
    //       })
    //     }
    //   })
    // }
  
    return array;
  }

  mapWeps() {
    var self = this;
    self.tf2.backpack.forEach(item => {
      if (Number(item.id) == 8165569884) {
        console.log(item);
      }
    });
    var backpack = self.tf2.backpack.filter((item) => {
      const isGift = item.attribute.some((attr) => {
        return attr.def_index == 185 || attr.def_index == 186;
      });
      return (
        this.weapons.includes(item.def_index) && 
        item.flags != 20 &&
        (item.origin == 0 || item.origin == 20) &&
        item.quality == 6
      );
    });
  
    for (var i = 0; i < backpack.length; i++) {
      if (backpack[i].attribute.length > 0) {
        backpack[i].attribute.forEach(function(attr) {
          if (attr.def_index == 211) {
            backpack.splice(i, 1);
          }
        });
      }
    }
  
    var items = {};
    backpack.forEach(function(item) {
      if (items.hasOwnProperty(item.def_index))
        items[item.def_index].push(item);
      else
        items[item.def_index] = [item];
    });
    if (self.safeMode)
      var threshold = 1;
    else
      var threshold = 0;
  
    var dupes = [];
    Object.keys(items).forEach(function(key) {
      if (threshold) {
        if (items[key].length > threshold) {
          dupes = dupes.concat(items[key].sort(function(a, b) {
            return b.level - a.level;
          }).slice(1));
        }
      } else {
        dupes = dupes.concat(items[key]);
      }
    });
  
    var byClass = {
      'scout': [],
      'soldier': [],
      'pyro': [],
      'demoman': [],
      'heavy': [],
      'engineer': [],
      'medic': [],
      'sniper': [],
      'spy': []
    };
  
    dupes.forEach(function(item) {
      Object.keys(self.weaponsByClass).forEach(function(cls) {
        if (self.weaponsByClass[cls].indexOf(item.def_index) > -1) {
          byClass[cls].push(item.id);
        }
      })
    })
  
    var length = 0;
    Object.keys(byClass).forEach(function(cls) {
      if (byClass[cls].length > 1 && length == 0) {
        length = 1;
      }
    })

    //console.log(byClass);
    if (length > 0)
      return byClass;
    else
      return false;
  }

  mapMetal(def) {
    var array = [];
    this.tf2.backpack.forEach(function(item) {
      if (item.def_index == def) {
        array.push(item.id);
      }
    })
    return array;
  }

  async craftWepsStep(items) {
    for (const pair of chunk(items)) {
      if (pair.length == 2)
        await this.craftSync([pair[0], pair[1]]);
    }
  }

  async craftMetalStep(items) {
    for (const group of chunk(items, 3)) {
      if (group.length == 3) {
        await this.craftSync([group[0], group[1], group[2]]);
      }
    }
  }

  craftSync(items) {
    return new Promise((resolve) => {
      this.tf2.craft(items);

      setTimeout(() => {
        console.log(items.join(', ') + ' have been crafted');
        resolve();
      }, 1000);
    });
  }

  deleteCrapStep(array, callback) {
    var self = this;
    var step = function(x) {
      if (x < array.length) {
        self.deleteSync(array[x], function() {
          step(x + 1);
        })
      } else {
        self.main();
      }
    }
    step(0);
  }

  deleteSync(crap, callback) {
    var self = this;
    //console.log('Deleting => ' + self.itemNames[crap]);
    self.tf2.deleteItem(crap);
  
    self.tf2.once('itemRemoved', function() {
      console.log(crap + ' removed');
      return callback();
    })
  }
}

module.exports = Waste;