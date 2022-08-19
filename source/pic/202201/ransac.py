from cProfile import label
import random
import math
import numpy.matlib
import numpy as np
import matplotlib.pyplot as plt

# adjust the axis
plt.axis([0, 10, 0, 10])
ax = plt.gca()
ax.set_aspect(1)

# point class
class Point:
    x = 0.0
    y = 0.0
    def __init__(self, x, y):
        self.x = x
        self.y = y

# generator points
def generator(array, numbers, func):
   for i in range(numbers):
       x = 10 * random.random()
       y = func(x)
       array.append(Point(x, y))

# draw points
def draw(path, points, txt, fig):
    # output
    x = []
    y = []
    data = ''
    for point in points:
        x.append(point.x)
        y.append(point.y)
        if txt:
            data = data + str(point.x) + ',' + str(point.y) + '\n'
    if txt:
        file = open(path + 'points.txt','w+')
        print(data, file=file)
        file.close()

    # draw the map
    if fig == 'o':
        plt.scatter(x, y, marker='o', alpha=0.5, label='inlier')
    else:
        plt.scatter(x, y, marker='^', c='red', alpha=0.5, label='outlier')


# RANSAC

# 两点法求解直线系数
def line(p1, p2):
    k = 0
    b = 0
    if p2.x - p1.x != 0:
        k = (p2.y - p1.y) / (p2.x - p1.x)
        b = p1.y - k * p1.x
    return [k, b]

# 点到直线距离
def distance(k, b, point):
    return abs(k * point.x - point.y + b) / math.sqrt(k * k + 1)

# 计算迭代次数
#   p - 样本点为内点的概率 0.7
#   z - 采样成功率 0.99 
#   k - 求解方程所需要的最少点数 2
def iterators(p, z, k):
    return int(math.log(1 - z)/math.log(1 - math.pow(p, k))) + 1

# RANSAC 求解算法
#   points - 采样点
def ransac(points):
    m = iterators(0.7, 0.99, 2)
    t = 0.5      # error threshold    
    count = 0    # count of inlier point
    res = [0, 0] # idea line params
    after = []
    errors = []
    for i in range(m):
        # 内点数组
        inlier = []
        outlier = []
        # 从 points 中随机取两个点
        indeces = random.sample(range(99), 2)
        p1 = points[indeces[0]]
        p2 = points[indeces[1]]
        # 生成直线
        [k,b] =line(p1, p2)
        # 判断其他点到该直线的距离
        for point in points:
            if distance(k, b, point) < t:
                inlier.append(point)
            else:
                outlier.append(point)
        # 统计内点个数
        if len(inlier) > count:
            count = len(inlier)
            res = [k, b]
            after = inlier
            errors = outlier
    # 最小二乘拟合
    B = np.mat(np.zeros((len(after), 2)))
    C = np.mat(np.zeros((len(after), 1)))
    for i in range(len(after)):
        B[i, 0] = after[i].x
        B[i, 1] = 1
        C[i, 0] = after[i].y
    L = (B.T * B).I * (B.T * C)
    # print(L)
    return res, L, count, after, errors


# def points
points = []
path = 'C:/Users/xxgcy/Desktop/'

# 50 standard points on y=x
generator(points, 50, lambda x : x)

# 20 inlier points for y=x
generator(points, 20, lambda x : x + random.random() - 0.5)

# 30 outlier points for y=x
generator(points, 50, lambda x : 10 * random.random())

# resolve
res, L, count, inlier, outlier = ransac(points)
res2 = [L[0,0], L[1,0]]
print(res, count)
print(res2, count)
draw(path, inlier, False, 'o')
draw(path, outlier, False, '^')

# line
x = np.linspace(0, 10, 50)
y = res[0] * x + res[1]
y2 = res2[0] * x + res2[1]
plt.plot(x, y)
plt.plot(x, y2, c='y')
plt.legend(loc='best') # 图例
# plt.savefig(path + 'point.png')
plt.show()
