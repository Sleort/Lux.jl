window.BENCHMARK_DATA = {
  "lastUpdate": 1714741057006,
  "repoUrl": "https://github.com/Sleort/Lux.jl",
  "entries": {
    "Benchmark Results": [
      {
        "commit": {
          "author": {
            "email": "avikpal@mit.edu",
            "name": "Avik Pal",
            "username": "avik-pal"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d94f947096e2062ba38004b836ef2c06bf64d504",
          "message": "Merge pull request #616 from LuxDL/ap/parallel_docs\n\nAttempt to build the tutorials in parallel",
          "timestamp": "2024-05-02T01:07:13-04:00",
          "tree_id": "dc56eebb303983054d777ee03a5aff9139b9bcdd",
          "url": "https://github.com/Sleort/Lux.jl/commit/d94f947096e2062ba38004b836ef2c06bf64d504"
        },
        "date": 1714741055457,
        "tool": "julia",
        "benches": [
          {
            "name": "Dense(2 => 2)/cpu/reverse/ReverseDiff (compiled)/(2, 128)",
            "value": 3693.125,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1312\nallocs=8\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":8,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/reverse/Zygote/(2, 128)",
            "value": 7135,
            "unit": "ns",
            "extra": "gctime=0\nmemory=5904\nallocs=38\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":6,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/reverse/Tracker/(2, 128)",
            "value": 21180,
            "unit": "ns",
            "extra": "gctime=0\nmemory=17224\nallocs=137\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/reverse/ReverseDiff/(2, 128)",
            "value": 9943.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=9968\nallocs=59\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":4,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/reverse/Flux/(2, 128)",
            "value": 8826.6,
            "unit": "ns",
            "extra": "gctime=0\nmemory=5472\nallocs=28\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":5,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/reverse/SimpleChains/(2, 128)",
            "value": 4474.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=3088\nallocs=28\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":8,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/forward/NamedTuple/(2, 128)",
            "value": 1122.343949044586,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1168\nallocs=3\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":157,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/forward/ComponentArray/(2, 128)",
            "value": 1200.3798449612402,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1168\nallocs=4\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":129,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/forward/Flux/(2, 128)",
            "value": 1803.7068965517242,
            "unit": "ns",
            "extra": "gctime=0\nmemory=2176\nallocs=2\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":58,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2 => 2)/cpu/forward/SimpleChains/(2, 128)",
            "value": 179.03894297635605,
            "unit": "ns",
            "extra": "gctime=0\nmemory=0\nallocs=0\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":719,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/reverse/ReverseDiff (compiled)/(20, 128)",
            "value": 17362,
            "unit": "ns",
            "extra": "gctime=0\nmemory=10592\nallocs=8\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/reverse/Zygote/(20, 128)",
            "value": 18424,
            "unit": "ns",
            "extra": "gctime=0\nmemory=35552\nallocs=38\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/reverse/Tracker/(20, 128)",
            "value": 37470,
            "unit": "ns",
            "extra": "gctime=0\nmemory=124696\nallocs=135\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/reverse/ReverseDiff/(20, 128)",
            "value": 28493,
            "unit": "ns",
            "extra": "gctime=0\nmemory=78432\nallocs=57\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/reverse/Flux/(20, 128)",
            "value": 19827,
            "unit": "ns",
            "extra": "gctime=0\nmemory=44400\nallocs=28\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/reverse/SimpleChains/(20, 128)",
            "value": 17202,
            "unit": "ns",
            "extra": "gctime=0\nmemory=17600\nallocs=28\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/forward/NamedTuple/(20, 128)",
            "value": 3889.75,
            "unit": "ns",
            "extra": "gctime=0\nmemory=10448\nallocs=3\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":8,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/forward/ComponentArray/(20, 128)",
            "value": 3969.875,
            "unit": "ns",
            "extra": "gctime=0\nmemory=10448\nallocs=4\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":8,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/forward/Flux/(20, 128)",
            "value": 4965,
            "unit": "ns",
            "extra": "gctime=0\nmemory=20736\nallocs=2\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":7,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(20 => 20)/cpu/forward/SimpleChains/(20, 128)",
            "value": 1667.1,
            "unit": "ns",
            "extra": "gctime=0\nmemory=0\nallocs=0\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":10,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/reverse/ReverseDiff (compiled)/(64, 64, 3, 128)",
            "value": 48245170,
            "unit": "ns",
            "extra": "gctime=0\nmemory=13063408\nallocs=87\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/reverse/Zygote/(64, 64, 3, 128)",
            "value": 82683430,
            "unit": "ns",
            "extra": "gctime=0\nmemory=20187296\nallocs=121\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/reverse/Tracker/(64, 64, 3, 128)",
            "value": 109823610,
            "unit": "ns",
            "extra": "gctime=0\nmemory=68204968\nallocs=282\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/reverse/ReverseDiff/(64, 64, 3, 128)",
            "value": 106675316.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=44196944\nallocs=187\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/reverse/Flux/(64, 64, 3, 128)",
            "value": 105882478,
            "unit": "ns",
            "extra": "gctime=0\nmemory=26098864\nallocs=155\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/reverse/SimpleChains/(64, 64, 3, 128)",
            "value": 11675554,
            "unit": "ns",
            "extra": "gctime=0\nmemory=5907440\nallocs=30\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/forward/NamedTuple/(64, 64, 3, 128)",
            "value": 14277136,
            "unit": "ns",
            "extra": "gctime=0\nmemory=6739056\nallocs=45\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/forward/ComponentArray/(64, 64, 3, 128)",
            "value": 14225120,
            "unit": "ns",
            "extra": "gctime=0\nmemory=6739280\nallocs=46\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/forward/Flux/(64, 64, 3, 128)",
            "value": 18259196,
            "unit": "ns",
            "extra": "gctime=0\nmemory=12643680\nallocs=50\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 3 => 3)/cpu/forward/SimpleChains/(64, 64, 3, 128)",
            "value": 6382546,
            "unit": "ns",
            "extra": "gctime=0\nmemory=0\nallocs=0\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Zygote/(32, 32, 3, 1)",
            "value": 114831956,
            "unit": "ns",
            "extra": "gctime=0\nmemory=185382824\nallocs=46391\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Zygote/(32, 32, 3, 16)",
            "value": 844390803,
            "unit": "ns",
            "extra": "gctime=2686619\nmemory=375255784\nallocs=46600\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Zygote/(32, 32, 3, 64)",
            "value": 3133872476,
            "unit": "ns",
            "extra": "gctime=283052256\nmemory=982778648\nallocs=46615\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Tracker/(32, 32, 3, 1)",
            "value": 141860395,
            "unit": "ns",
            "extra": "gctime=1346015\nmemory=451818224\nallocs=11599\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Tracker/(32, 32, 3, 16)",
            "value": 879186593,
            "unit": "ns",
            "extra": "gctime=1648016\nmemory=659670528\nallocs=11817\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Tracker/(32, 32, 3, 64)",
            "value": 2845902970,
            "unit": "ns",
            "extra": "gctime=42510596\nmemory=1324614400\nallocs=11817\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Flux/(32, 32, 3, 1)",
            "value": 88970228,
            "unit": "ns",
            "extra": "gctime=0\nmemory=183065264\nallocs=10472\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Flux/(32, 32, 3, 16)",
            "value": 746794966.5,
            "unit": "ns",
            "extra": "gctime=1005460.5\nmemory=390051984\nallocs=10676\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/reverse/Flux/(32, 32, 3, 64)",
            "value": 3392689987,
            "unit": "ns",
            "extra": "gctime=324813185\nmemory=1052233584\nallocs=10676\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/NamedTuple/(32, 32, 3, 1)",
            "value": 32783241,
            "unit": "ns",
            "extra": "gctime=0\nmemory=15969552\nallocs=1193\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/NamedTuple/(32, 32, 3, 16)",
            "value": 305338950,
            "unit": "ns",
            "extra": "gctime=0\nmemory=52507904\nallocs=1273\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/NamedTuple/(32, 32, 3, 64)",
            "value": 951478935,
            "unit": "ns",
            "extra": "gctime=1396558\nmemory=169393312\nallocs=1273\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/ComponentArray/(32, 32, 3, 1)",
            "value": 29011820,
            "unit": "ns",
            "extra": "gctime=0\nmemory=15966192\nallocs=1109\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/ComponentArray/(32, 32, 3, 16)",
            "value": 306318269,
            "unit": "ns",
            "extra": "gctime=0\nmemory=52505168\nallocs=1189\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/ComponentArray/(32, 32, 3, 64)",
            "value": 941173978.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=169390576\nallocs=1189\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/Flux/(32, 32, 3, 1)",
            "value": 29158794,
            "unit": "ns",
            "extra": "gctime=0\nmemory=16971936\nallocs=887\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/Flux/(32, 32, 3, 16)",
            "value": 203252831,
            "unit": "ns",
            "extra": "gctime=0\nmemory=69608176\nallocs=968\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "vgg16/cpu/forward/Flux/(32, 32, 3, 64)",
            "value": 897268215,
            "unit": "ns",
            "extra": "gctime=1421665\nmemory=238006832\nallocs=968\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/reverse/ReverseDiff (compiled)/(64, 64, 64, 128)",
            "value": 1141452117.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=278646368\nallocs=88\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/reverse/Zygote/(64, 64, 64, 128)",
            "value": 1874937488.5,
            "unit": "ns",
            "extra": "gctime=682289.5\nmemory=430579584\nallocs=122\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/reverse/Tracker/(64, 64, 64, 128)",
            "value": 2182971162,
            "unit": "ns",
            "extra": "gctime=173094850\nmemory=1455079336\nallocs=283\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/reverse/ReverseDiff/(64, 64, 64, 128)",
            "value": 2339555131,
            "unit": "ns",
            "extra": "gctime=139570933.5\nmemory=942830016\nallocs=187\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/reverse/Flux/(64, 64, 64, 128)",
            "value": 1948015663.5,
            "unit": "ns",
            "extra": "gctime=6916017.5\nmemory=556546960\nallocs=156\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/forward/NamedTuple/(64, 64, 64, 128)",
            "value": 339814584,
            "unit": "ns",
            "extra": "gctime=0\nmemory=143677680\nallocs=45\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/forward/ComponentArray/(64, 64, 64, 128)",
            "value": 338470146,
            "unit": "ns",
            "extra": "gctime=0\nmemory=143677904\nallocs=46\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 64 => 64)/cpu/forward/Flux/(64, 64, 64, 128)",
            "value": 449544426,
            "unit": "ns",
            "extra": "gctime=0\nmemory=269638112\nallocs=50\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/reverse/ReverseDiff (compiled)/(64, 64, 1, 128)",
            "value": 11952147,
            "unit": "ns",
            "extra": "gctime=0\nmemory=4360336\nallocs=87\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/reverse/Zygote/(64, 64, 1, 128)",
            "value": 29221853,
            "unit": "ns",
            "extra": "gctime=0\nmemory=6736368\nallocs=121\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/reverse/Tracker/(64, 64, 1, 128)",
            "value": 19130025,
            "unit": "ns",
            "extra": "gctime=0\nmemory=22747256\nallocs=280\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/reverse/ReverseDiff/(64, 64, 1, 128)",
            "value": 23832040,
            "unit": "ns",
            "extra": "gctime=0\nmemory=14742624\nallocs=185\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/reverse/Flux/(64, 64, 1, 128)",
            "value": 17923416,
            "unit": "ns",
            "extra": "gctime=0\nmemory=8711680\nallocs=155\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/reverse/SimpleChains/(64, 64, 1, 128)",
            "value": 1159733,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1970304\nallocs=30\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/forward/NamedTuple/(64, 64, 1, 128)",
            "value": 4407355,
            "unit": "ns",
            "extra": "gctime=0\nmemory=2249264\nallocs=45\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/forward/ComponentArray/(64, 64, 1, 128)",
            "value": 4252697.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=2249488\nallocs=46\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/forward/Flux/(64, 64, 1, 128)",
            "value": 2065564,
            "unit": "ns",
            "extra": "gctime=0\nmemory=4217632\nallocs=50\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 1 => 1)/cpu/forward/SimpleChains/(64, 64, 1, 128)",
            "value": 196095,
            "unit": "ns",
            "extra": "gctime=0\nmemory=0\nallocs=0\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/reverse/ReverseDiff (compiled)/(200, 128)",
            "value": 296141,
            "unit": "ns",
            "extra": "gctime=0\nmemory=102672\nallocs=9\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/reverse/Zygote/(200, 128)",
            "value": 267288.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=470784\nallocs=42\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/reverse/Tracker/(200, 128)",
            "value": 370730,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1614552\nallocs=149\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/reverse/ReverseDiff/(200, 128)",
            "value": 411410.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1040224\nallocs=66\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/reverse/Flux/(200, 128)",
            "value": 278319,
            "unit": "ns",
            "extra": "gctime=0\nmemory=571712\nallocs=33\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/reverse/SimpleChains/(200, 128)",
            "value": 407548,
            "unit": "ns",
            "extra": "gctime=0\nmemory=747840\nallocs=30\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/forward/NamedTuple/(200, 128)",
            "value": 82504,
            "unit": "ns",
            "extra": "gctime=0\nmemory=102528\nallocs=4\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/forward/ComponentArray/(200, 128)",
            "value": 83866,
            "unit": "ns",
            "extra": "gctime=0\nmemory=102528\nallocs=5\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/forward/Flux/(200, 128)",
            "value": 87042,
            "unit": "ns",
            "extra": "gctime=0\nmemory=204896\nallocs=4\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(200 => 200)/cpu/forward/SimpleChains/(200, 128)",
            "value": 104445,
            "unit": "ns",
            "extra": "gctime=0\nmemory=0\nallocs=0\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/reverse/ReverseDiff (compiled)/(64, 64, 16, 128)",
            "value": 208675524.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=69640608\nallocs=87\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/reverse/Zygote/(64, 64, 16, 128)",
            "value": 341735631,
            "unit": "ns",
            "extra": "gctime=0\nmemory=107625472\nallocs=121\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/reverse/Tracker/(64, 64, 16, 128)",
            "value": 425426649,
            "unit": "ns",
            "extra": "gctime=1446642\nmemory=363701032\nallocs=280\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/reverse/ReverseDiff/(64, 64, 16, 128)",
            "value": 449118533,
            "unit": "ns",
            "extra": "gctime=619704\nmemory=235664000\nallocs=185\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/reverse/Flux/(64, 64, 16, 128)",
            "value": 404987671,
            "unit": "ns",
            "extra": "gctime=0\nmemory=139122704\nallocs=155\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/reverse/SimpleChains/(64, 64, 16, 128)",
            "value": 331866138,
            "unit": "ns",
            "extra": "gctime=0\nmemory=31520192\nallocs=30\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/forward/NamedTuple/(64, 64, 16, 128)",
            "value": 55944948.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=35922672\nallocs=45\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/forward/ComponentArray/(64, 64, 16, 128)",
            "value": 56001111.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=35922896\nallocs=46\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/forward/Flux/(64, 64, 16, 128)",
            "value": 58615413,
            "unit": "ns",
            "extra": "gctime=0\nmemory=67412960\nallocs=50\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Conv((3, 3), 16 => 16)/cpu/forward/SimpleChains/(64, 64, 16, 128)",
            "value": 27895389.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=0\nallocs=0\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/reverse/ReverseDiff (compiled)/(2000, 128)",
            "value": 18726424,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1024272\nallocs=9\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/reverse/Zygote/(2000, 128)",
            "value": 19466158,
            "unit": "ns",
            "extra": "gctime=0\nmemory=19082816\nallocs=42\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/reverse/Tracker/(2000, 128)",
            "value": 23146196.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=59293848\nallocs=149\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/reverse/ReverseDiff/(2000, 128)",
            "value": 24024935.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=39178656\nallocs=66\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/reverse/Flux/(2000, 128)",
            "value": 19610387.5,
            "unit": "ns",
            "extra": "gctime=0\nmemory=20105344\nallocs=33\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/forward/NamedTuple/(2000, 128)",
            "value": 6491424,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1024128\nallocs=4\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/forward/ComponentArray/(2000, 128)",
            "value": 6482135,
            "unit": "ns",
            "extra": "gctime=0\nmemory=1024128\nallocs=5\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          },
          {
            "name": "Dense(2000 => 2000)/cpu/forward/Flux/(2000, 128)",
            "value": 6489338,
            "unit": "ns",
            "extra": "gctime=0\nmemory=2048096\nallocs=4\nparams={\"gctrial\":true,\"time_tolerance\":0.05,\"evals_set\":false,\"samples\":10000,\"evals\":1,\"gcsample\":false,\"seconds\":5,\"overhead\":0,\"memory_tolerance\":0.01}"
          }
        ]
      }
    ]
  }
}